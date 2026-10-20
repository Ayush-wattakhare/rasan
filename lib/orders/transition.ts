import { createServiceClient } from '@/lib/supabase/server';
import { canTransition, normalizeOrderStatus, type OrderActor } from '@/lib/utils/order-transitions';
import { verifyHandoverCode } from '@/lib/utils/delivery-otp-server';
import { rateLimitShared } from '@/lib/utils/rate-limit';
import { releaseOrderStock } from '@/lib/orders/stock';
import { refundOrderPayment } from '@/lib/payments/refunds';
import { cancelPlanForOrder } from '@/lib/subscriptions/from-order';
import {
  notifyKitchenCooking,
  notifyOutForDelivery,
  notifyOrderDelivered,
} from '@/lib/notifications/transactional';
import type { OrderStatus, UserRole } from '@/types';

/** Minimum a rider earns per delivery when the order carries no delivery fee. */
const MIN_PARTNER_FEE = 35;

/** Orders one rider may carry at the same time. */
export const MAX_ACTIVE_DELIVERIES = 3;

const TRACKING_MESSAGES: Partial<Record<OrderStatus, string>> = {
  confirmed: 'Order confirmed by kitchen.',
  preparing: 'Chef has started cooking your meal.',
  ready: 'Fresh meal is ready and packed for delivery pickup.',
  picked_up: 'Food picked up from the home kitchen.',
  out_for_delivery: 'Rider is out for delivery to your location.',
  delivered: 'Order delivered successfully.',
  cancelled: 'Order cancelled.',
};

const CUSTOMER_NOTIFICATIONS: Partial<Record<OrderStatus, { title: string; message: string }>> = {
  ready: {
    title: '🍱 Meal Fresh & Ready for Pickup!',
    message: 'Your food is freshly packed and waiting for delivery partner pickup.',
  },
  picked_up: {
    title: '🥡 Food Picked Up!',
    message: 'Rider has picked up your fresh meal and is on the move.',
  },
  out_for_delivery: {
    title: '🚀 Out for Delivery!',
    message: 'Your tiffin is on the way to your doorstep. ETA ~10-15 mins.',
  },
  delivered: {
    title: '✨ Order Delivered!',
    message: 'Your delicious home-cooked meal has arrived. Enjoy!',
  },
  cancelled: {
    title: 'Order Cancelled',
    message:
      'Sorry, your order could not be fulfilled and was cancelled. If you paid online, a full refund has been sent to your original payment method.',
  },
};

export type TransitionResult =
  | { ok: true; order: any }
  | { ok: false; status: number; error: string };

const failure = (status: number, error: string): TransitionResult => ({ ok: false, status, error });

/** Maps a profile role to the actor that may move orders, if any. */
export function actorForRole(role: UserRole | null): OrderActor | null {
  return role === 'vendor' || role === 'delivery' || role === 'admin' ? role : null;
}

type ServiceClient = ReturnType<typeof createServiceClient>;

async function actorOwnsOrder(
  serviceClient: ServiceClient,
  actor: OrderActor,
  userId: string,
  order: { vendor_id: string | null; delivery_partner_id: string | null }
): Promise<boolean> {
  if (actor === 'admin') return true;

  if (actor === 'vendor') {
    if (!order.vendor_id) return false;
    const { data } = await serviceClient
      .from('vendors')
      .select('id')
      .eq('id', order.vendor_id)
      .eq('user_id', userId)
      .maybeSingle();
    return !!data;
  }

  if (!order.delivery_partner_id) return false;
  const { data } = await serviceClient
    .from('delivery_partners')
    .select('id')
    .eq('id', order.delivery_partner_id)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

/**
 * Moves an order to a new status on behalf of a vendor, rider or admin.
 *
 * - The actor must own the order (vendor's kitchen / assigned rider).
 * - The change must be allowed for that actor (lib/utils/order-transitions).
 * - Unpaid online orders cannot be accepted by the kitchen.
 * - Riders must enter the customer's handover OTP to mark delivered.
 * - The update is conditional on the current status, so replays and races
 *   cannot apply the same transition twice. Rider earnings are credited by
 *   the `update_delivery_partner_stats` database trigger on that transition.
 */
export async function transitionOrder(params: {
  orderId: string;
  actor: OrderActor;
  userId: string;
  status: unknown;
  otp?: unknown;
}): Promise<TransitionResult> {
  const to = normalizeOrderStatus(params.status);
  if (!params.orderId || !to) return failure(400, 'Invalid order or status');

  const serviceClient = createServiceClient();
  const { data: order } = await serviceClient
    .from('orders')
    .select(
      'id, order_number, status, customer_id, vendor_id, delivery_partner_id, tracking_updates, delivery_fee, payment_method, payment_status, total, delivery_address'
    )
    .eq('id', params.orderId)
    .maybeSingle();

  if (!order) return failure(404, 'Order not found');

  if (!(await actorOwnsOrder(serviceClient, params.actor, params.userId, order))) {
    return failure(403, 'You are not assigned to this order');
  }

  const from = order.status as OrderStatus;
  if (!canTransition(params.actor, from, to)) {
    return failure(409, `Cannot change order from ${from} to ${to}`);
  }

  const isOnlinePayment = order.payment_method !== 'cash';
  if (isOnlinePayment && order.payment_status !== 'paid' && to !== 'cancelled') {
    return failure(409, 'Order is awaiting payment');
  }

  if (to === 'delivered' && params.actor === 'delivery') {
    if (!params.otp) {
      return failure(400, 'Customer 4-digit Delivery PIN is required to complete handover.');
    }
    // A 4-digit PIN has only 9000 values: cap attempts per rider and order.
    const attempts = await rateLimitShared(`delivery-otp:${params.userId}:${order.id}`, {
      interval: 15 * 60 * 1000,
      maxRequests: 5,
    });
    if (!attempts.success) {
      return failure(429, 'Too many PIN attempts. Please wait and try again, or contact support.');
    }
    if (!(await verifyHandoverCode(order.id, params.otp))) {
      return failure(
        400,
        'Incorrect Delivery PIN. Please ask customer for the 4-digit security code shown on their tracking screen.'
      );
    }
  }

  const nowIso = new Date().toISOString();
  const tracking = Array.isArray(order.tracking_updates) ? order.tracking_updates : [];
  const updateData: Record<string, unknown> = {
    status: to,
    updated_at: nowIso,
    tracking_updates: [
      ...tracking,
      { status: to, timestamp: nowIso, message: TRACKING_MESSAGES[to] ?? `Status updated to ${to}` },
    ],
  };

  if (to === 'delivered') {
    updateData.actual_delivery_time = nowIso;
    // Cash is collected at the door; online orders are already paid.
    if (!isOnlinePayment) updateData.payment_status = 'paid';
    // What the rider earns is stored apart from what the customer paid
    // (orders.rider_fee, migration 008), so order totals stay consistent.
    const fee = Number(order.delivery_fee) || 0;
    updateData.rider_fee = fee > 0 ? fee : MIN_PARTNER_FEE;
  }

  const runUpdate = (data: Record<string, unknown>) =>
    serviceClient
      .from('orders')
      .update(data as any)
      .eq('id', order.id)
      .eq('status', from)
      .select()
      .maybeSingle();

  let { data: updated, error } = await runUpdate(updateData);
  if (error && 'rider_fee' in updateData && /rider_fee/.test(error.message || '')) {
    // Migration 008 not applied yet: fall back to the old behaviour.
    const { rider_fee, ...rest } = updateData;
    ({ data: updated, error } = await runUpdate({ ...rest, delivery_fee: rider_fee }));
  }

  if (error) {
    console.error('Order transition error:', error);
    return failure(500, 'Failed to update order');
  }
  if (!updated) return failure(409, 'Order was updated by someone else. Please refresh.');

  if (to === 'cancelled') {
    // The kitchen / admin cancelled: stock goes back and the customer gets a full refund.
    await releaseOrderStock(order.id);
    await cancelPlanForOrder(order.id);
    if (isOnlinePayment && order.payment_status === 'paid') {
      const refund = await refundOrderPayment({
        orderId: order.id,
        amount: Number(order.total),
        reason: `Order cancelled by ${params.actor === 'vendor' ? 'the kitchen' : params.actor}`,
        referenceId: `${params.actor.toUpperCase()}-CANCEL-${order.id}`,
      });
      if (!refund.ok && refund.reason !== 'not-paid') {
        console.error(`Refund after ${params.actor} cancellation of ${order.id} failed:`, refund.message);
      }
    }
  }

  const notification = CUSTOMER_NOTIFICATIONS[to];
  if (notification && order.customer_id) {
    try {
      await serviceClient.from('notifications').insert({
        user_id: order.customer_id,
        type: to === 'ready' ? 'order' : 'delivery',
        title: notification.title,
        message: notification.message,
        is_read: false,
      });
    } catch {
      // Notifications are best-effort.
    }
  }

  // Fire off transactional SMS/WhatsApp async in background (non-blocking)
  if (['preparing', 'out_for_delivery', 'delivered'].includes(to)) {
    (async () => {
      try {
        let phone = (order.delivery_address as any)?.phone;
        if (!phone && order.customer_id) {
          const { data: cust } = await serviceClient
            .from('profiles')
            .select('phone')
            .eq('id', order.customer_id)
            .maybeSingle();
          phone = cust?.phone;
        }

        if (!phone) return;

        const orderNum = order.order_number || order.id.slice(0, 8).toUpperCase();

        if (to === 'preparing' && order.vendor_id) {
          const { data: v } = await serviceClient
            .from('vendors')
            .select('business_name')
            .eq('id', order.vendor_id)
            .maybeSingle();
          await notifyKitchenCooking({
            orderId: order.id,
            orderNumber: orderNum,
            customerPhone: phone,
            vendorName: v?.business_name || 'Home Kitchen',
          });
        } else if (to === 'out_for_delivery') {
          let riderName = 'Delivery Partner';
          let riderPhone: string | undefined;
          if (order.delivery_partner_id) {
            const { data: partner } = await serviceClient
              .from('delivery_partners')
              .select('user_id')
              .eq('id', order.delivery_partner_id)
              .maybeSingle();
            if (partner?.user_id) {
              const { data: rProfile } = await serviceClient
                .from('profiles')
                .select('name, phone')
                .eq('id', partner.user_id)
                .maybeSingle();
              if (rProfile?.name) riderName = rProfile.name;
              if (rProfile?.phone) riderPhone = rProfile.phone;
            }
          }
          await notifyOutForDelivery({
            orderId: order.id,
            orderNumber: orderNum,
            customerPhone: phone,
            riderName,
            riderPhone,
          });
        } else if (to === 'delivered') {
          await notifyOrderDelivered({
            orderId: order.id,
            orderNumber: orderNum,
            customerPhone: phone,
          });
        }
      } catch (err: any) {
        console.warn('Transactional notification dispatch exception:', err?.message || err);
      }
    })();
  }

  return { ok: true, order: updated };
}

/**
 * Lets the assigned rider record that cash was collected for a COD order
 * before the final OTP handover.
 */
export async function recordCashCollected(params: {
  orderId: string;
  userId: string;
}): Promise<TransitionResult> {
  const serviceClient = createServiceClient();
  const { data: order } = await serviceClient
    .from('orders')
    .select('id, status, vendor_id, delivery_partner_id, payment_method, payment_status')
    .eq('id', params.orderId)
    .maybeSingle();

  if (!order) return failure(404, 'Order not found');
  if (!(await actorOwnsOrder(serviceClient, 'delivery', params.userId, order))) {
    return failure(403, 'You are not assigned to this order');
  }
  if (order.payment_method !== 'cash') return failure(409, 'Only cash orders can be marked as collected');
  if (!['picked_up', 'out_for_delivery', 'delivered'].includes(order.status)) {
    return failure(409, 'Pick up the order before collecting payment');
  }
  if (order.payment_status === 'paid') return { ok: true, order };

  const { data: updated, error } = await serviceClient
    .from('orders')
    .update({ payment_status: 'paid', updated_at: new Date().toISOString() })
    .eq('id', order.id)
    .eq('payment_status', order.payment_status)
    .select()
    .maybeSingle();

  if (error || !updated) return failure(500, 'Failed to record payment');
  return { ok: true, order: updated };
}

/**
 * A verified rider claims a ready, unassigned order (and picks it up).
 * The update only succeeds while the order is still `ready` with no rider,
 * so two riders can never both win the same order.
 */
export async function claimOrderForPartner(params: {
  orderId: string;
  userId: string;
}): Promise<TransitionResult> {
  const serviceClient = createServiceClient();

  const { data: partner } = await serviceClient
    .from('delivery_partners')
    .select('id, is_verified, is_online')
    .eq('user_id', params.userId)
    .maybeSingle();

  if (!partner) return failure(404, 'Delivery partner record not found');
  if (!partner.is_verified) return failure(403, 'Your rider account is awaiting admin verification');
  if (!partner.is_online) return failure(409, 'Go online to accept orders');

  // One rider can't hoard orders: cap how many are in flight at once.
  const { count: active } = await serviceClient
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('delivery_partner_id', partner.id)
    .in('status', ['picked_up', 'out_for_delivery']);
  if ((active ?? 0) >= MAX_ACTIVE_DELIVERIES) {
    return failure(409, `You already have ${MAX_ACTIVE_DELIVERIES} active deliveries. Finish one before accepting another.`);
  }

  const { data: order } = await serviceClient
    .from('orders')
    .select('id, status, customer_id, delivery_partner_id, tracking_updates, payment_method, payment_status')
    .eq('id', params.orderId)
    .maybeSingle();

  if (!order) return failure(404, 'Order not found');
  if (order.delivery_partner_id) return failure(409, 'Order already assigned');
  if (order.status !== 'ready') return failure(409, 'Order is not ready for pickup');
  if (order.payment_method !== 'cash' && order.payment_status !== 'paid') {
    return failure(409, 'Order is awaiting payment');
  }

  const nowIso = new Date().toISOString();
  const tracking = Array.isArray(order.tracking_updates) ? order.tracking_updates : [];

  const { data: updated, error } = await serviceClient
    .from('orders')
    .update({
      delivery_partner_id: partner.id,
      status: 'picked_up',
      updated_at: nowIso,
      tracking_updates: [
        ...tracking,
        {
          status: 'picked_up',
          timestamp: nowIso,
          message: 'A delivery partner accepted your order and is collecting it from the kitchen.',
        },
      ] as any,
    })
    .eq('id', order.id)
    .eq('status', 'ready')
    .is('delivery_partner_id', null)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Claim order error:', error);
    return failure(500, 'Failed to accept order');
  }
  if (!updated) return failure(409, 'Order was just taken by another rider');

  if (order.customer_id) {
    try {
      await serviceClient.from('notifications').insert({
        user_id: order.customer_id,
        type: 'delivery',
        title: '🛵 Rider Assigned!',
        message: 'A delivery partner has accepted your tiffin and is collecting it from the kitchen.',
        is_read: false,
      });
    } catch {
      // Notifications are best-effort.
    }
  }

  return { ok: true, order: updated };
}
