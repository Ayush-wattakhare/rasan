import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/guards';
import { isUuid } from '@/lib/utils/validation-ids';
import { MAX_ACTIVE_DELIVERIES } from '@/lib/orders/transition';

/** Statuses where a rider can be (re)assigned. */
const REASSIGNABLE = ['ready', 'picked_up', 'out_for_delivery'];

/** Admin hands an order to another online, verified rider. Status is unchanged. */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const { orderId, targetRiderId, reason } = body ?? {};

    if (!isUuid(orderId) || !isUuid(targetRiderId)) {
      return NextResponse.json({ error: 'orderId and targetRiderId are required' }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const [{ data: order }, { data: rider }] = await Promise.all([
      serviceClient
        .from('orders')
        .select('id, order_number, status, customer_id, delivery_partner_id')
        .eq('id', orderId)
        .maybeSingle(),
      (serviceClient.from('delivery_partners') as any)
        .select('id, user_id, is_verified, is_online, profile:profiles(name, phone, is_active)')
        .eq('id', targetRiderId)
        .maybeSingle(),
    ]);

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (!REASSIGNABLE.includes(order.status as string)) {
      return NextResponse.json(
        { error: `A rider can only be assigned once the food is ready (order is ${order.status})` },
        { status: 409 }
      );
    }
    if (!rider || !rider.is_verified || rider.profile?.is_active === false) {
      return NextResponse.json({ error: 'Target rider not found or not verified' }, { status: 400 });
    }
    if (!rider.is_online) {
      return NextResponse.json({ error: 'That rider is offline' }, { status: 409 });
    }
    if (order.delivery_partner_id === rider.id) {
      return NextResponse.json({ error: 'The order is already assigned to this rider' }, { status: 409 });
    }

    const { count: load } = await serviceClient
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('delivery_partner_id', rider.id)
      .in('status', ['picked_up', 'out_for_delivery']);
    if ((load ?? 0) >= MAX_ACTIVE_DELIVERIES) {
      return NextResponse.json({ error: `That rider already has ${load} active deliveries` }, { status: 409 });
    }

    const previousRiderId = order.delivery_partner_id;

    // Conditional on status AND current rider so a concurrent change isn't overwritten.
    let update = serviceClient
      .from('orders')
      .update({ delivery_partner_id: rider.id, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('status', order.status as any);
    update = previousRiderId ? update.eq('delivery_partner_id', previousRiderId) : update.is('delivery_partner_id', null);
    const { data: reassigned, error: updateError } = await update.select('id').maybeSingle();

    if (updateError) {
      console.error('Live-ops reassign error:', updateError);
      return NextResponse.json({ error: 'Failed to reassign order' }, { status: 500 });
    }
    if (!reassigned) {
      return NextResponse.json({ error: 'Order changed meanwhile. Please refresh.' }, { status: 409 });
    }

    const label = order.order_number || order.id.slice(0, 8);
    const note = typeof reason === 'string' && reason.trim() ? reason.trim().slice(0, 200) : 'Operational re-assignment';
    const notifications: any[] = [
      {
        user_id: rider.user_id,
        type: 'delivery',
        title: '🚨 Order Assigned to You',
        message: `Order #${label} has been assigned to you by Rasan operations. Reason: ${note}.`,
        is_read: false,
      },
    ];
    if (order.customer_id) {
      notifications.push({
        user_id: order.customer_id,
        type: 'order',
        title: '🛵 Delivery Partner Updated',
        message: `Your order #${label} is now with ${rider.profile?.name || 'a new delivery partner'}.`,
        is_read: false,
      });
    }
    if (previousRiderId) {
      const { data: previous } = await serviceClient
        .from('delivery_partners')
        .select('user_id')
        .eq('id', previousRiderId)
        .maybeSingle();
      if (previous?.user_id) {
        notifications.push({
          user_id: previous.user_id,
          type: 'delivery',
          title: 'Order Reassigned',
          message: `Order #${label} was moved to another rider. You no longer need to deliver it.`,
          is_read: false,
        });
      }
    }
    const { error: notifyError } = await serviceClient.from('notifications').insert(notifications);
    if (notifyError) console.warn('Reassign notifications failed:', notifyError.message);

    return NextResponse.json({
      success: true,
      message: `Order #${label} assigned to ${rider.profile?.name || 'the selected rider'}.`,
      previousRiderId,
      newRiderId: rider.id,
    });
  } catch (err) {
    console.error('Live-ops reassign error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
