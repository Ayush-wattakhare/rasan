import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { hmacSha256Hex, markOrderPaid, signaturesMatch, toMinorUnits } from '@/lib/payments/order-payment';

/**
 * Razorpay webhook. Marks an order paid when its gateway order is captured
 * for the full amount. Idempotent: only orders still awaiting payment change,
 * so replays and late events cannot revive cancelled or refunded orders.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-razorpay-signature') || '';
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature || !secret) {
    console.error('Missing signature or secret for payment webhook');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!signaturesMatch(hmacSha256Hex(secret, body), signature)) {
    console.error('Invalid signature for payment webhook');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  try {
    const event = JSON.parse(body);

    if (event.event === 'payment.captured') {
      const payment = event.payload?.payment?.entity ?? {};
      const gatewayOrderId: string | undefined = payment.order_id;

      if (!gatewayOrderId || !payment.id) {
        return NextResponse.json({ success: true, ignored: 'missing order id' });
      }

      const { data: order } = await createServiceClient()
        .from('orders')
        .select('id, total, payment_status')
        .eq('payment_order_id', gatewayOrderId)
        .maybeSingle();

      if (!order) {
        console.warn(`Webhook: no order for gateway order ${gatewayOrderId}`);
        return NextResponse.json({ success: true, ignored: 'unknown order' });
      }

      if (Number(payment.amount) !== toMinorUnits(order.total)) {
        console.error(`Webhook: amount mismatch for order ${order.id}`);
        return NextResponse.json({ success: true, ignored: 'amount mismatch' });
      }

      const result = await markOrderPaid(order.id, payment.id);
      if (!result.ok) {
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
  }
}
