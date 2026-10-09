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
    const { orderId, targetRiderId, reason } = body;

    if (!orderId || !targetRiderId) {
      return NextResponse.json({ error: 'orderId and targetRiderId are required' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // 1. Get order and target rider details
    const [{ data: order }, { data: rider }] = await Promise.all([
      serviceClient.from('orders').select('*').eq('id', orderId).maybeSingle(),
      serviceClient.from('delivery_partners').select('*, profile:profiles(name, email, phone)').eq('id', targetRiderId).maybeSingle(),
    ]);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const previousRiderId = order.delivery_partner_id;

    // 2. Update order with new delivery partner
    const { error: updateError } = await serviceClient
      .from('orders')
      .update({
        delivery_partner_id: targetRiderId,
        status: order.status === 'pending' || order.status === 'confirmed' ? 'confirmed' : order.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 3. Send notifications
    try {
      // Notify new rider
      if (rider?.user_id) {
        await serviceClient.from('notifications').insert({
          user_id: rider.user_id,
          type: 'delivery',
          title: '🚨 Urgent Mission Reassigned to You',
          message: `Mission #${order.id.slice(0, 8)} has been assigned to you by Dispatch Control. Reason: ${reason || 'Operational re-assignment'}.`,
          is_read: false,
        });
      }

      // Notify customer of rider update
      if (order.customer_id) {
        await serviceClient.from('notifications').insert({
          user_id: order.customer_id,
          type: 'order',
          title: '🛵 Delivery Partner Updated',
          message: `Your order #${order.id.slice(0, 8)} is now assigned to pilot ${rider?.profile?.name || 'Rohan'}.`,
          is_read: false,
        });
      }
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Order #${order.id.slice(0, 8)} successfully reassigned to ${rider?.profile?.name || 'new pilot'}.`,
      previousRiderId,
      newRiderId: targetRiderId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
