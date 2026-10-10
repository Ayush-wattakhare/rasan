import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/guards';
import { PaymentStatus } from '@/types';

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

    // Fetch order details matching database schema (customer_id)
    const { data: order, error: orderError } = await serviceClient
      .from('orders')
      .select('id, customer_id, status, payment_status, total, created_at')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const isOwner = order.customer_id === user.id;
    const isAdmin = auth.role === 'admin';

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

    // Refund policy by status. Only money actually received can be refunded.
    const wasPaid = order.payment_status === 'paid';
    let refundPercentage = 0;
    let policyReason = '';

    if (['pending', 'confirmed'].includes(order.status)) {
      refundPercentage = 100;
      policyReason = 'Full 100% refund applied (Cancelled before kitchen preparation).';
    } else if (order.status === 'preparing') {
      refundPercentage = 50;
      policyReason = '50% partial refund applied (Food preparation already in progress).';
    } else if (['out_for_delivery', 'picked_up', 'ready'].includes(order.status)) {
      refundPercentage = 0;
      policyReason = 'Non-refundable (Order is ready or out for delivery).';
    }

    if (!wasPaid) {
      refundPercentage = 0;
      policyReason = 'No payment was collected for this order.';
    }

    const paymentStatus: PaymentStatus =
      wasPaid && refundPercentage > 0 ? 'refunded' : (order.payment_status as PaymentStatus);
    const refundAmount = (order.total * refundPercentage) / 100;

    // Conditional on the current status so a concurrent transition isn't overwritten.
    const { data: cancelled, error: updateError } = await serviceClient
      .from('orders')
      .update({
        status: 'cancelled',
        payment_status: paymentStatus,
      })
      .eq('id', orderId)
      .eq('status', order.status)
      .select('id')
      .maybeSingle();

    if (updateError) {
      console.error('Cancel order error:', updateError);
      return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
    }
    if (!cancelled) {
      return NextResponse.json(
        { error: 'Order status changed. Please refresh and try again.' },
        { status: 409 }
      );
    }

    // Send customer notification alert
    try {
      await serviceClient.from('notifications').insert({
        user_id: order.customer_id,
        type: 'order',
        title: refundAmount > 0 ? 'Order Cancelled & Refund Processed' : 'Order Cancelled',
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
