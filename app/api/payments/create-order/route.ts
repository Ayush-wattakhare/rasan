import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/guards';
import { PAYABLE_PAYMENT_STATUSES, loadPayableOrder, toMinorUnits } from '@/lib/payments/order-payment';

const razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

const razorpay = razorpayKeyId && razorpayKeySecret
  ? new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    })
  : null;

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })
  : null;

/**
 * Starts a gateway payment for one of the caller's unpaid orders.
 * The amount always comes from the order in the database; any amount in the
 * request body is ignored. The gateway's order / intent id is stored on the
 * order so /api/payments/verify can bind the payment to it.
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { orderId, provider } = body ?? {};

    if (!orderId || !provider) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const payable = await loadPayableOrder(orderId, auth.user.id);
    if ('error' in payable) {
      return NextResponse.json({ error: payable.error }, { status: payable.status });
    }
    const { order } = payable;
    const amount = toMinorUnits(order.total);
    const serviceClient = createServiceClient();

    /** Binds the gateway order/intent id to our order (only while it is still payable). */
    const bindGatewayId = async (gatewayId: string) => {
      const { data, error } = await serviceClient
        .from('orders')
        .update({ payment_order_id: gatewayId })
        .eq('id', order.id)
        .in('payment_status', [...PAYABLE_PAYMENT_STATUSES])
        .select('id')
        .maybeSingle();
      if (error || !data) {
        console.error('Failed to bind gateway id to order', order.id, error);
        return false;
      }
      return true;
    };

    if (provider === 'razorpay') {
      if (!razorpay) {
        return NextResponse.json({ error: 'Razorpay not configured' }, { status: 500 });
      }

      // Reuse the gateway order already bound to this order while it is still open:
      // a second tab or retry must not orphan a payment made on the first one.
      if (order.payment_order_id?.startsWith('order_')) {
        try {
          const existing = await razorpay.orders.fetch(order.payment_order_id);
          if (existing && existing.status !== 'paid' && Number(existing.amount) === amount) {
            return NextResponse.json({
              id: existing.id,
              amount: existing.amount,
              currency: existing.currency,
              orderId: order.id,
            });
          }
        } catch (fetchErr) {
          console.warn('Could not reuse Razorpay order, creating a new one:', fetchErr);
        }
      }

      const razorpayOrder = await razorpay.orders.create({
        amount,
        currency: 'INR',
        receipt: order.id,
        notes: {
          order_id: order.id,
          customer_id: auth.user.id,
        },
      });

      if (!(await bindGatewayId(razorpayOrder.id))) {
        return NextResponse.json({ error: 'Order is no longer awaiting payment' }, { status: 409 });
      }

      return NextResponse.json({
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        orderId: order.id,
      });
    }

    if (provider === 'stripe') {
      if (!stripe) {
        return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
      }

      if (order.payment_order_id?.startsWith('pi_')) {
        try {
          const existing = await stripe.paymentIntents.retrieve(order.payment_order_id);
          const reusable =
            existing.amount === amount &&
            !['succeeded', 'canceled'].includes(existing.status);
          if (reusable) {
            return NextResponse.json({
              clientSecret: existing.client_secret,
              paymentIntentId: existing.id,
            });
          }
        } catch (fetchErr) {
          console.warn('Could not reuse Stripe intent, creating a new one:', fetchErr);
        }
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'inr',
        metadata: {
          order_id: order.id,
          customer_id: auth.user.id,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      if (!(await bindGatewayId(paymentIntent.id))) {
        return NextResponse.json({ error: 'Order is no longer awaiting payment' }, { status: 409 });
      }

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    }

    return NextResponse.json({ error: 'Invalid payment provider' }, { status: 400 });
  } catch (error) {
    console.error('Payment order creation error:', error);
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
  }
}
