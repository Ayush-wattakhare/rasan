import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { orderId, reason, faultAttribution, refundCustomer, refundAmount, compensateVendor, compensateRider } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const { data: order, error: fetchError } = await serviceClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status === 'delivered' || order.status === 'cancelled') {
      return NextResponse.json({ error: `Order is already ${order.status}` }, { status: 409 });
    }

    // A refund is only possible for money actually received, and never above the order total.
    const wasPaid = order.payment_status === 'paid';
    const requestedRefund = Number(refundAmount ?? order.total);
    const refund = refundCustomer && wasPaid
      ? Math.min(Math.max(Number.isFinite(requestedRefund) ? requestedRefund : 0, 0), Number(order.total))
      : 0;

    // Conditional on the current status so a concurrent transition isn't overwritten.
    const { data: cancelled, error: updateError } = await serviceClient
      .from('orders')
      .update({
        status: 'cancelled',
        ...(refund > 0 ? { payment_status: 'refunded' as const } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('status', order.status)
      .select('id')
      .maybeSingle();

    if (updateError) {
      console.error('Live-ops cancel error:', updateError);
      return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
    }
    if (!cancelled) {
      return NextResponse.json({ error: 'Order status changed. Please refresh.' }, { status: 409 });
    }

    // Send notifications to Customer, Vendor, and Rider
    try {
      if (order.customer_id) {
        await serviceClient.from('notifications').insert({
          user_id: order.customer_id,
          type: 'order',
          title: 'Order Cancelled by Dispatch',
          message: `Order #${order.id.slice(0, 8)} has been cancelled. Reason: ${reason || 'Operational cancellation'}. ${refund > 0 ? `Refund of ₹${refund} initiated.` : ''}`,
          is_read: false,
        });
      }
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Order #${order.id.slice(0, 8)} cancelled successfully. Fault: ${faultAttribution || 'General'}.`,
      orderId,
      refundIssued: refund > 0,
      refundAmount: refund,
    });
  } catch (err: any) {
    console.error('Live-ops cancel error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
