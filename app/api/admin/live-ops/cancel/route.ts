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

    // Update order status to cancelled
    const { error: updateError } = await serviceClient
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Send notifications to Customer, Vendor, and Rider
    try {
      if (order.customer_id) {
        await serviceClient.from('notifications').insert({
          user_id: order.customer_id,
          type: 'order',
          title: 'Order Cancelled by Dispatch',
          message: `Order #${order.id.slice(0, 8)} has been cancelled. Reason: ${reason || 'Operational cancellation'}. ${refundCustomer ? `Refund of ₹${refundAmount || order.total} initiated.` : ''}`,
          is_read: false,
        });
      }
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Order #${order.id.slice(0, 8)} cancelled successfully. Fault: ${faultAttribution || 'General'}.`,
      orderId,
      refundIssued: !!refundCustomer,
      refundAmount: refundCustomer ? (refundAmount || order.total) : 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
