import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import {
  hmacSha256Hex,
  markOrderPaid,
  signaturesMatch,
  toMinorUnits,
} from '@/lib/payments/order-payment';
import { notifyOrderConfirmed } from '@/lib/notifications/transactional';

/**
 * Razorpay webhook handler with cryptographic verification and idempotency protection.
 * Protects against duplicate network retries, race conditions, and replay events.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-razorpay-signature') || '';
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature || !secret) {
    console.error('Missing signature or secret for payment webhook');
    return NextResponse.json(
      { error: 'Unauthorized: missing signature or webhook secret' },
      { status: 401 }
    );
  }

  if (!signaturesMatch(hmacSha256Hex(secret, body), signature)) {
    console.error('Invalid signature for payment webhook');
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 403 });
  }

  try {
    const event = JSON.parse(body);
    const serviceClient = createServiceClient();

    // 1. Handle Successful Payment Capture & Order Paid
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload?.payment?.entity ?? {};
      const gatewayOrderId: string | undefined =
        payment.order_id || event.payload?.order?.entity?.id;
      const paymentId = payment.id || event.payload?.payment?.entity?.id;

      if (!gatewayOrderId || !paymentId) {
        return NextResponse.json({ success: true, ignored: 'missing order or payment id' });
      }

      const { data: order } = await serviceClient
        .from('orders')
        .select(
          'id, order_number, total, payment_status, customer_id, delivery_address, profiles(phone, name)'
        )
        .eq('payment_order_id', gatewayOrderId)
        .maybeSingle();

      if (!order) {
        console.warn(`Webhook: no matching order found for gateway order ${gatewayOrderId}`);
        return NextResponse.json({ success: true, ignored: 'unknown order' });
      }

      // Explicit Idempotency Guard: if already paid, return 200 immediately
      if (order.payment_status === 'paid') {
        return NextResponse.json({
          success: true,
          idempotent: true,
          message: 'Order already captured and marked as paid',
        });
      }

      if (payment.amount && Number(payment.amount) !== toMinorUnits(order.total)) {
        console.error(
          `Webhook: amount mismatch for order ${order.id}. Expected ${toMinorUnits(order.total)}, got ${payment.amount}`
        );
        return NextResponse.json({ success: true, ignored: 'amount mismatch' });
      }

      const result = await markOrderPaid(order.id, paymentId);
      if (!result.ok) {
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      // Dispatch customer transactional notification
      const customerPhone =
        (order.profiles as any)?.phone || (order.delivery_address as any)?.phone;
      if (customerPhone) {
        notifyOrderConfirmed({
          orderId: order.id,
          orderNumber: order.order_number || order.id.slice(0, 8).toUpperCase(),
          customerPhone,
          totalAmount: order.total,
        }).catch((err) => console.warn('Notification dispatch note:', err));
      }

      return NextResponse.json({
        success: true,
        orderId: order.id,
        paymentId,
        status: 'confirmed',
      });
    }

    // 2. Handle Payment Failure
    if (event.event === 'payment.failed') {
      const payment = event.payload?.payment?.entity ?? {};
      const gatewayOrderId: string | undefined = payment.order_id;

      if (gatewayOrderId) {
        await serviceClient
          .from('orders')
          .update({
            payment_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('payment_order_id', gatewayOrderId)
          .eq('payment_status', 'pending');
      }

      return NextResponse.json({ success: true, recorded: 'payment.failed' });
    }

    return NextResponse.json({ success: true, ignored: `unhandled event ${event.event}` });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
  }
}
