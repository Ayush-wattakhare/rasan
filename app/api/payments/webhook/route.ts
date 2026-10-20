import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import {
  hmacSha256Hex,
  markOrderPaid,
  signaturesMatch,
  toMinorUnits,
} from '@/lib/payments/order-payment';
import { applyRefundWebhook, refundStrayPayment } from '@/lib/payments/refunds';
import { warnRazorpayConfigOnce } from '@/lib/payments/razorpay-client';
import { isUuid } from '@/lib/utils/validation-ids';
import { notifyOrderConfirmed } from '@/lib/notifications/transactional';

const ORDER_COLUMNS =
  'id, order_number, total, status, payment_status, payment_id, customer_id, delivery_address, profiles(phone, name)';

/** True when this event id was already handled (Razorpay retries deliveries). */
async function alreadyProcessed(eventId: string | null): Promise<boolean> {
  if (!eventId) return false;
  const { data, error } = await (createServiceClient().from('payment_events' as any) as any)
    .select('event_id')
    .eq('event_id', eventId)
    .maybeSingle();
  if (error) return false; // table missing (migration 008 not applied): rely on order state
  return !!data;
}

async function rememberEvent(eventId: string | null, event: string): Promise<void> {
  if (!eventId) return;
  const { error } = await (createServiceClient().from('payment_events' as any) as any)
    .upsert({ event_id: eventId, event }, { onConflict: 'event_id', ignoreDuplicates: true });
  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.warn('Webhook: could not record event id:', error.message);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-razorpay-signature') || '';
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    warnRazorpayConfigOnce();
    console.error('Payment webhook rejected: RAZORPAY_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 });
  }
  if (!signature) {
    return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 });
  }
  if (!signaturesMatch(hmacSha256Hex(secret, body), signature)) {
    console.error('Invalid signature for payment webhook');
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 403 });
  }

  const eventId = request.headers.get('x-razorpay-event-id');

  try {
    const event = JSON.parse(body);
    if (await alreadyProcessed(eventId)) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    const response = await handleEvent(event);
    if (response.status < 500) await rememberEvent(eventId, String(event?.event || 'unknown'));
    return response;
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
  }
}

async function handleEvent(event: any): Promise<NextResponse> {
  const serviceClient = createServiceClient();

  if (event.event === 'payment.captured' || event.event === 'order.paid') {
    const payment = event.payload?.payment?.entity ?? {};
    const gatewayOrderId: string | undefined = payment.order_id || event.payload?.order?.entity?.id;
    const paymentId: string | undefined = payment.id;
    const capturedMinor = Number(payment.amount);

    if (!gatewayOrderId || !paymentId) {
      return NextResponse.json({ success: true, ignored: 'missing order or payment id' });
    }

    // Bound gateway order first; fall back to our order id in the notes (the
    // customer may have paid on an older gateway order that was replaced).
    let { data: order } = await (serviceClient.from('orders') as any)
      .select(ORDER_COLUMNS)
      .eq('payment_order_id', gatewayOrderId)
      .maybeSingle();
    const notedOrderId = payment.notes?.order_id || event.payload?.order?.entity?.notes?.order_id;
    if (!order && isUuid(notedOrderId)) {
      ({ data: order } = await (serviceClient.from('orders') as any)
        .select(ORDER_COLUMNS)
        .eq('id', notedOrderId)
        .maybeSingle());
    }

    if (!order) {
      console.error(`Webhook: captured payment ${paymentId} has no matching order (gateway order ${gatewayOrderId})`);
      return NextResponse.json({ success: true, ignored: 'unknown order' });
    }

    const customer = {
      id: order.id,
      order_number: order.order_number,
      customer_id: order.customer_id,
      customer_name: order.profiles?.name ?? null,
    };

    // The same payment recorded already (verify got there first).
    if (order.payment_status === 'paid' && order.payment_id === paymentId) {
      return NextResponse.json({ success: true, idempotent: true });
    }

    // Already paid with ANOTHER payment: this one is a duplicate charge.
    if (order.payment_status === 'paid' || order.payment_status === 'refunded') {
      await refundStrayPayment({
        paymentId,
        amountMinor: capturedMinor,
        order: customer,
        reason: 'Duplicate payment: the order was already paid',
      });
      return NextResponse.json({ success: true, refunded: 'duplicate payment' });
    }

    const currencyOk = !payment.currency || payment.currency === 'INR';
    if (!currencyOk || !Number.isFinite(capturedMinor) || capturedMinor !== toMinorUnits(order.total)) {
      console.error(
        `Webhook: payment ${paymentId} does not match order ${order.id} (got ${payment.amount} ${payment.currency}, expected ${toMinorUnits(order.total)} INR)`
      );
      await refundStrayPayment({
        paymentId,
        amountMinor: capturedMinor,
        order: customer,
        reason: 'Payment amount/currency did not match the order',
      });
      return NextResponse.json({ success: true, refunded: 'amount mismatch' });
    }

    const result = await markOrderPaid(order.id, paymentId);
    if (!result.ok) {
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    if (!result.changed) {
      // payment.captured and order.paid (or verify) can race for the same payment:
      // if this exact payment is now recorded, it's a harmless duplicate.
      const { data: latest } = await serviceClient
        .from('orders')
        .select('payment_status, payment_id')
        .eq('id', order.id)
        .maybeSingle();
      if (latest?.payment_status === 'paid' && latest.payment_id === paymentId) {
        return NextResponse.json({ success: true, idempotent: true });
      }
      if (latest?.payment_status === 'paid' || latest?.payment_status === 'refunded') {
        await refundStrayPayment({
          paymentId,
          amountMinor: capturedMinor,
          order: customer,
          reason: 'Duplicate payment: the order was already paid',
        });
        return NextResponse.json({ success: true, refunded: 'duplicate payment' });
      }

      // Captured but the order can't take it (cancelled or expired meanwhile).
      console.error(`CAPTURED_ON_UNPAYABLE: order ${order.id} payment ${paymentId}; refunding`);
      await refundStrayPayment({
        paymentId,
        amountMinor: capturedMinor,
        order: customer,
        reason: result.cancelled
          ? 'Payment arrived after the order was cancelled'
          : 'Payment arrived for an order that was no longer awaiting payment',
      });
      if (order.customer_id) {
        await serviceClient.from('notifications').insert({
          user_id: order.customer_id,
          type: 'payment',
          title: 'Payment Refunded',
          message: `Your payment for order #${order.order_number || order.id.slice(0, 8)} arrived after the order was closed, so it is being refunded to your original payment method.`,
          is_read: false,
        });
      }
      return NextResponse.json({ success: true, changed: false, message: 'Order not payable; refund issued' });
    }

    const customerPhone = order.profiles?.phone || order.delivery_address?.phone;
    if (customerPhone) {
      notifyOrderConfirmed({
        orderId: order.id,
        orderNumber: order.order_number || order.id.slice(0, 8).toUpperCase(),
        customerPhone,
        totalAmount: order.total,
      }).catch((err) => console.warn('Notification dispatch note:', err));
    }

    return NextResponse.json({ success: true, orderId: order.id, paymentId, status: 'confirmed' });
  }

  if (event.event === 'payment.failed') {
    const payment = event.payload?.payment?.entity ?? {};
    const gatewayOrderId: string | undefined = payment.order_id;
    if (gatewayOrderId) {
      await serviceClient
        .from('orders')
        .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
        .eq('payment_order_id', gatewayOrderId)
        .eq('payment_status', 'pending');
    }
    return NextResponse.json({ success: true, recorded: 'payment.failed' });
  }

  if (event.event === 'refund.processed' || event.event === 'refund.failed') {
    await applyRefundWebhook(event.event, event.payload?.refund?.entity);
    return NextResponse.json({ success: true, recorded: event.event });
  }

  return NextResponse.json({ success: true, ignored: `unhandled event ${event.event}` });
}
