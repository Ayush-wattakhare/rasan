import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/guards';
import {
  hmacSha256Hex,
  loadPayableOrder,
  markOrderPaid,
  signaturesMatch,
  toMinorUnits,
} from '@/lib/payments/order-payment';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })
  : null;

/**
 * Confirms a gateway payment for one of the caller's orders.
 * The payment must belong to the gateway order / intent created for this
 * order by /api/payments/create-order, so a payment for one order (or a
 * cheaper one) cannot be replayed against another.
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { paymentId, orderId, razorpayOrderId, signature, provider } = body ?? {};

    if (!paymentId || !orderId || !provider) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const payable = await loadPayableOrder(orderId, auth.user.id);
    if ('error' in payable) {
      // The webhook may already have recorded this exact payment.
      const { data: existing } = await createServiceClient()
        .from('orders')
        .select('payment_status, payment_id')
        .eq('id', orderId)
        .eq('customer_id', auth.user.id)
        .maybeSingle();
      if (existing?.payment_status === 'paid' && existing.payment_id === paymentId) {
        return NextResponse.json({ success: true, message: 'Payment already verified' });
      }
      return NextResponse.json({ error: payable.error }, { status: payable.status });
    }
    const { order } = payable;

    if (provider === 'razorpay') {
      const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!razorpaySecret) {
        return NextResponse.json({ error: 'Razorpay not configured' }, { status: 500 });
      }
      if (!signature || !razorpayOrderId) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
      }
      if (!order.payment_order_id || order.payment_order_id !== razorpayOrderId) {
        return NextResponse.json({ error: 'Payment does not belong to this order' }, { status: 400 });
      }

      const expected = hmacSha256Hex(razorpaySecret, `${razorpayOrderId}|${paymentId}`);
      if (!signaturesMatch(expected, signature)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    } else if (provider === 'stripe') {
      if (!stripe) {
        return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
      const matchesOrder =
        paymentIntent.id === order.payment_order_id &&
        paymentIntent.metadata?.order_id === order.id &&
        paymentIntent.amount === toMinorUnits(order.total);

      if (!matchesOrder) {
        return NextResponse.json({ error: 'Payment does not belong to this order' }, { status: 400 });
      }
      if (paymentIntent.status !== 'succeeded') {
        return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid payment provider' }, { status: 400 });
    }

    const result = await markOrderPaid(order.id, paymentId);
    if (!result.ok) {
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}
