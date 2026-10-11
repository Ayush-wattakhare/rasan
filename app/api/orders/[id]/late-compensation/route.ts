import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/guards';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const auth = await requireUser();
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const serviceClient = createServiceClient();

    const { data: order, error: orderError } = await serviceClient
      .from('orders')
      .select('id, customer_id, status, total, estimated_delivery_time, actual_delivery_time, created_at, compensated_at')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Must be the customer who placed the order
    if (order.customer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (order.status !== 'delivered') {
      return NextResponse.json(
        { error: 'Late delivery compensation is only applicable after order delivery' },
        { status: 400 }
      );
    }

    if (order.compensated_at) {
      return NextResponse.json(
        { eligible: false, message: 'Compensation has already been issued for this order.' },
        { status: 409 }
      );
    }

    // Delay = actual delivery time vs the promised time (estimate, or 35 min after ordering).
    const DEFAULT_ETA_MINUTES = 35;
    const expectedDeliveryTime = order.estimated_delivery_time
      ? new Date(order.estimated_delivery_time).getTime()
      : new Date(order.created_at).getTime() + DEFAULT_ETA_MINUTES * 60 * 1000;
    const actualDeliveryTime = order.actual_delivery_time
      ? new Date(order.actual_delivery_time).getTime()
      : NaN;

    if (!Number.isFinite(expectedDeliveryTime) || !Number.isFinite(actualDeliveryTime)) {
      return NextResponse.json({
        eligible: false,
        message: 'Delivery time is not recorded for this order.',
      });
    }

    const delayMinutes = Math.round((actualDeliveryTime - expectedDeliveryTime) / 60000);

    if (delayMinutes < 15) {
      return NextResponse.json({
        eligible: false,
        message: `Order was delivered within acceptable window (${delayMinutes}m delay). Compensation threshold is >15m.`,
      });
    }

    // Issue 15% late compensation credit, once per order.
    const compensationAmount = (order.total * 15) / 100;

    const { data: claimed, error: claimError } = await serviceClient
      .from('orders')
      .update({ compensated_at: new Date().toISOString() })
      .eq('id', order.id)
      .is('compensated_at', null)
      .select('id')
      .maybeSingle();

    if (claimError) {
      console.error('Late compensation claim error:', claimError);
      return NextResponse.json({ error: 'Failed to issue compensation' }, { status: 500 });
    }
    if (!claimed) {
      return NextResponse.json(
        { eligible: false, message: 'Compensation has already been issued for this order.' },
        { status: 409 }
      );
    }

    // Send compensation notification
    await serviceClient.from('notifications').insert({
      user_id: order.customer_id,
      type: 'order',
      title: 'Late Delivery Compensation Issued ⏱️',
      message: `Your order delivered ${delayMinutes} mins late. A 15% late compensation credit of ₹${compensationAmount.toFixed(2)} has been granted to your account!`,
      is_read: false,
    });

    return NextResponse.json({
      eligible: true,
      success: true,
      delayMinutes,
      compensationAmount,
      message: `Late delivery compensation of ₹${compensationAmount.toFixed(2)} issued successfully!`,
    });
  } catch (error: any) {
    console.error('Late compensation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
