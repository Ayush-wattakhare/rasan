import { createServiceClient } from '@/lib/supabase/server';
import { SUBSCRIPTION_MEAL_TYPES } from '@/lib/pricing/subscription-pricing';
import { getItemPricing } from '@/lib/pricing/order-pricing';
import {
  defaultPlanStart,
  isValidPlanStart,
  normalizeDeliveryDays,
  planDates,
  planEndDate,
  type SchedulablePlan,
} from '@/lib/pricing/plan-schedule';

/**
 * The subscription bought with a checkout order, created on the server so it
 * exists even if the customer's browser closes after paying.
 *
 * - Online payment: created as 'pending_payment'; markOrderPaid() activates it.
 * - Cash: active once the kitchen has the order (cash orders start 'confirmed').
 *
 * Price is the plan line item (what the customer paid for the meals of the
 * plan), not the whole order total with fees and any one-time items.
 */

export type OrderForSubscription = {
  id: string;
  customer_id: string;
  vendor_id: string;
  items: unknown;
  status: string | null;
  payment_status: string | null;
  payment_method: string | null;
  delivery_address?: unknown;
};

export type FromOrderResult =
  | { ok: true; subscription: any; created: boolean }
  | { ok: false; status: number; error: string };

function planItem(items: unknown): any | null {
  if (!Array.isArray(items)) return null;
  return items.find((i: any) => i?.subscription_type === 'weekly' || i?.subscription_type === 'monthly') ?? null;
}

export function orderHasPlan(items: unknown): boolean {
  return planItem(items) !== null;
}

/** Status the plan should have for this order right now. */
export function planStatusForOrder(order: Pick<OrderForSubscription, 'payment_status' | 'payment_method' | 'status'>) {
  const paid = order.payment_status === 'paid';
  const cashConfirmed = order.payment_method === 'cash' && order.status !== 'pending' && order.status !== 'cancelled';
  return {
    status: paid || cashConfirmed ? ('active' as const) : ('pending_payment' as const),
    paymentStatus: paid ? ('paid' as const) : ('pending' as const),
  };
}

export async function createSubscriptionForOrder(
  order: OrderForSubscription,
  options: {
    address: Record<string, unknown>;
    autoRenew?: boolean;
    /** Backfill of old orders: move a start date that has passed to the next valid day. */
    rescheduleIfPast?: boolean;
  }
): Promise<FromOrderResult> {
  const db = createServiceClient();

  const { data: existing } = await (db.from('subscriptions') as any)
    .select('*')
    .eq('order_id', order.id)
    .maybeSingle();
  if (existing) return { ok: true, subscription: existing, created: false };

  if (order.status === 'cancelled') return { ok: false, status: 409, error: 'Order is cancelled' };

  const item = planItem(order.items);
  if (!item) return { ok: false, status: 400, error: 'Order has no subscription plan' };

  const planType = item.subscription_type as SchedulablePlan;
  const days = normalizeDeliveryDays(item.delivery_days);
  let startDate: string = item.plan_start_date;
  if (!isValidPlanStart(startDate)) {
    if (!options.rescheduleIfPast && item.plan_start_date) {
      // A plan bought for a past date: honour what was sold rather than guess.
      startDate = item.plan_start_date;
    } else {
      startDate = defaultPlanStart();
    }
  }

  const dates = planDates(planType, startDate, days);
  if (dates.length === 0) {
    return { ok: false, status: 400, error: 'No deliveries fall in this plan' };
  }
  if (!options.rescheduleIfPast && typeof item.meal_count === 'number' && item.meal_count !== dates.length) {
    return { ok: false, status: 409, error: 'Plan schedule does not match the order. Please contact support.' };
  }

  const { data: meal } = await db.from('meals').select('meal_type').eq('id', item.meal_id).maybeSingle();
  const mealType = (SUBSCRIPTION_MEAL_TYPES as readonly string[]).includes(meal?.meal_type as string)
    ? (meal!.meal_type as string)
    : 'lunch';

  const price = getItemPricing({
    price: Number(item.price),
    quantity: Number(item.quantity) || 1,
    subscription_type: planType as any,
    delivery_days: days,
    plan_start_date: item.plan_start_date || startDate,
  }).finalPrice;

  const { status, paymentStatus } = planStatusForOrder(order);
  const deliveryTime =
    typeof item.delivery_time === 'string' && item.delivery_time ? item.delivery_time.slice(0, 16) : '12:30 PM';

  const { data: subscription, error } = await (db.from('subscriptions') as any)
    .insert({
      customer_id: order.customer_id,
      vendor_id: order.vendor_id,
      order_id: order.id,
      plan_type: planType,
      meal_type: mealType,
      start_date: startDate,
      end_date: planEndDate(planType, startDate),
      delivery_days: days,
      delivery_time: deliveryTime,
      address: options.address,
      price,
      status,
      payment_status: paymentStatus,
      auto_renew: options.autoRenew === true,
      deliveries: dates.map((date) => ({ date, status: 'scheduled', order_id: null })),
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      const { data: raced } = await (db.from('subscriptions') as any).select('*').eq('order_id', order.id).maybeSingle();
      if (raced) return { ok: true, subscription: raced, created: false };
    }
    console.error('createSubscriptionForOrder failed:', error);
    return { ok: false, status: 500, error: 'Failed to create subscription' };
  }
  return { ok: true, subscription, created: true };
}

/**
 * The order that bought a plan was cancelled: the plan is cancelled too
 * (whether it was waiting for payment or already started for cash).
 */
export async function cancelPlanForOrder(orderId: string): Promise<void> {
  const { error } = await (createServiceClient().from('subscriptions') as any)
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('order_id', orderId)
    .in('status', ['pending_payment', 'active', 'paused']);
  if (error) console.error(`cancelPlanForOrder(${orderId}) failed:`, error);
}
