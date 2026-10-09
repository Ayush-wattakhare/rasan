import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })
  : null;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId, orderId, razorpayOrderId, signature, provider } = body;

    if (!paymentId || !orderId || !provider) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (provider === 'razorpay') {
      if (!signature) {
        return NextResponse.json(
          { error: 'Missing signature' },
          { status: 400 }
        );
      }

      // Verify Razorpay signature
      const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!razorpaySecret) {
        return NextResponse.json(
          { error: 'Razorpay not configured' },
          { status: 500 }
        );
      }

      const orderIdForVerification = razorpayOrderId || orderId;
      const generatedSignature = crypto
        .createHmac('sha256', razorpaySecret)
        .update(`${orderIdForVerification}|${paymentId}`)
        .digest('hex');

      if (generatedSignature !== signature) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 400 }
        );
      }

      // Update order payment status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_id: paymentId,
          status: 'confirmed',
        })
        .eq('id', orderId)
        .eq('customer_id', user.id);

      if (updateError) {
        console.error('Order update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update order' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
      });
    } else if (provider === 'stripe') {
      if (!stripe) {
        return NextResponse.json(
          { error: 'Stripe not configured' },
          { status: 500 }
        );
      }

      // Retrieve payment intent to verify
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);

      if (paymentIntent.status !== 'succeeded') {
        return NextResponse.json(
          { error: 'Payment not successful' },
          { status: 400 }
        );
      }

      // Update order payment status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_id: paymentId,
          status: 'confirmed',
        })
        .eq('id', orderId)
        .eq('customer_id', user.id);

      if (updateError) {
        console.error('Order update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update order' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid payment provider' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      {
        error: 'Failed to verify payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
