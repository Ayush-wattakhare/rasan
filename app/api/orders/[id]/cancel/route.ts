import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { PaymentStatus } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createServiceClient();

    // Fetch order details matching database schema (customer_id)
    const { data: order, error: orderError } = await serviceClient
      .from('orders')
      .select('id, customer_id, status, payment_status, total, created_at')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check authorization (must be customer owner or admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isOwner = order.customer_id === user.id;
    const isAdmin = profile?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (order.status === 'cancelled') {
      return NextResponse.json({
        success: true,
        message: 'Order is already cancelled',
        alreadyCancelled: true,
      });
    }

    if (order.status === 'delivered') {
      return NextResponse.json(
        { error: 'Cannot cancel an order that has already been delivered.' },
        { status: 400 }
      );
    }

    if (!isAdmin && !['pending', 'confirmed'].includes(order.status)) {
      return NextResponse.json(
        { error: 'Cannot cancel order once food preparation has started or the order is out for delivery.' },
        { status: 400 }
      );
    }

    // Determine refund policy based on current status
    let refundPercentage = 0;
    let paymentStatus: PaymentStatus = 'failed';
    let policyReason = '';

    if (['pending', 'confirmed'].includes(order.status)) {
      refundPercentage = 100;
      paymentStatus = 'refunded';
      policyReason = 'Full 100% refund applied (Cancelled before kitchen preparation).';
    } else if (order.status === 'preparing') {
      refundPercentage = 50;
      paymentStatus = 'refunded';
      policyReason = '50% partial refund applied (Food preparation already in progress).';
    } else if (['out_for_delivery', 'picked_up'].includes(order.status)) {
      refundPercentage = 0;
      paymentStatus = 'failed';
      policyReason = 'Non-refundable (Order is currently out for delivery).';
    }

    const refundAmount = (order.total * refundPercentage) / 100;

    // Update order status and payment status
    const { error: updateError } = await serviceClient
      .from('orders')
      .update({
        status: 'cancelled',
        payment_status: paymentStatus,
      })
      .eq('id', orderId);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to cancel order: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Send customer notification alert
    try {
      await serviceClient.from('notifications').insert({
        user_id: order.customer_id,
        type: 'order',
        title: 'Order Cancelled & Refund Processed',
        message: `Order #${orderId.slice(0, 8)} has been cancelled. ${policyReason} Refund Amount: ₹${refundAmount.toFixed(2)}`,
        is_read: false,
      });
    } catch {
      // Non-critical notification error
    }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      cancellation: {
        orderId,
        previousStatus: order.status,
        refundPercentage,
        refundAmount,
        paymentStatus,
        policyReason,
      },
    });
  } catch (error: any) {
    console.error('Cancellation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
