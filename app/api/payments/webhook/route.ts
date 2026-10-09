import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-razorpay-signature') || '';
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // Basic validation
  if (!signature || !secret) {
    console.error('Missing signature or secret for payment webhook');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (expectedSignature !== signature) {
    console.error('Invalid signature for payment webhook');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  try {
    const event = JSON.parse(body);
    const supabase = await createServiceClient();

    // Handle payment.captured event
    if (event.event === 'payment.captured') {
      const { order_id, id: payment_id } = event.payload.payment.entity;
      const notes = event.payload.payment.entity.notes || {};
      const appOrderId = notes.order_id || order_id; // Try to get our app's internal order ID from notes

      if (appOrderId) {
        // Update order status using service role to ensure success
        const { error } = await supabase
          .from('orders')
          .update({ 
            payment_status: 'paid', 
            payment_id: payment_id,
            status: 'confirmed' // Auto-confirm once paid
          })
          .eq('id', appOrderId);

        if (error) {
          console.error('Failed to update order via webhook:', error);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }
        
        console.log(`Payment successful for order ${appOrderId} via webhook`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
  }
}
