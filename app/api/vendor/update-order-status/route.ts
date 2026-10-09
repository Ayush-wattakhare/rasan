import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Database enum order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'cancelled'
    const dbStatus = status === 'ready_for_pickup' ? 'ready' : status;

    const serviceClient = createServiceClient();

    const { data: existingOrder } = await serviceClient
      .from('orders')
      .select('id, customer_id, tracking_updates')
      .eq('id', orderId)
      .single();

    const nowIso = new Date().toISOString();
    const existingUpdates = Array.isArray(existingOrder?.tracking_updates) ? existingOrder.tracking_updates : [];
    const updatedTracking = [
      ...existingUpdates,
      {
        status: dbStatus,
        timestamp: nowIso,
        message:
          dbStatus === 'confirmed'
            ? 'Order confirmed by kitchen.'
            : dbStatus === 'preparing'
            ? 'Chef has started cooking your meal.'
            : dbStatus === 'ready'
            ? 'Fresh meal is ready and packed for delivery pickup.'
            : `Status changed to ${dbStatus}`,
      },
    ];

    const { data: updatedOrder, error: updateError } = await serviceClient
      .from('orders')
      .update({
        status: dbStatus,
        tracking_updates: updatedTracking,
        updated_at: nowIso,
      })
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Update status DB error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Notify customer
    if (dbStatus === 'ready' && updatedOrder?.customer_id) {
      try {
        await serviceClient.from('notifications').insert({
          user_id: updatedOrder.customer_id,
          type: 'order',
          title: '🍱 Meal Fresh & Ready for Pickup!',
          message: `Your food for Order #${orderId.slice(0, 8)} is freshly packed and waiting for delivery partner pickup.`,
          is_read: false,
        });
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order: updatedOrder },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update order status' },
      { status: 500 }
    );
  }
}
