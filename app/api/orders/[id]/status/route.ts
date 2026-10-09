import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return handleStatusUpdate(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handleStatusUpdate(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handleStatusUpdate(request, context);
}

async function handleStatusUpdate(request: NextRequest, context: RouteContext) {
  try {
    const { id: orderId } = await context.params;
    const body = await request.json();
    const { status, payment_status } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const serviceClient = createServiceClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: order, error: orderError } = await serviceClient
      .from('orders')
      .select('id, status, customer_id, delivery_partner_id, tracking_updates, delivery_fee')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Database enum order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'cancelled'
    const dbStatus = status ? (status === 'ready_for_pickup' ? 'ready' : status) : order.status;

    const nowIso = new Date().toISOString();
    const existingUpdates = Array.isArray(order.tracking_updates) ? order.tracking_updates : [];

    const updateData: any = {
      updated_at: nowIso,
    };

    if (status) {
      updateData.status = dbStatus;
      updateData.tracking_updates = [
        ...existingUpdates,
        {
          status: dbStatus,
          timestamp: nowIso,
          message:
            dbStatus === 'picked_up'
              ? 'Food picked up from kitchen.'
              : dbStatus === 'out_for_delivery'
              ? 'Rider is out for delivery to your location.'
              : dbStatus === 'delivered'
              ? 'Order delivered successfully.'
              : `Status updated to ${dbStatus}`,
        },
      ];
    }

    if (payment_status) {
      updateData.payment_status = payment_status;
    }

    if (dbStatus === 'delivered') {
      updateData.actual_delivery_time = nowIso;
      updateData.payment_status = 'paid';

      // Ensure guaranteed delivery partner pay (base minimum 35)
      const currentFee = Number(order.delivery_fee) || 0;
      const partnerFee = currentFee > 0 ? currentFee : 35.00;
      updateData.delivery_fee = partnerFee;

      // Credit to delivery partner earnings
      if (order.delivery_partner_id) {
        try {
          const { data: partnerData } = await serviceClient
            .from('delivery_partners')
            .select('id, earnings, total_deliveries')
            .eq('id', order.delivery_partner_id)
            .single();

          if (partnerData) {
            const oldEarnings = partnerData.earnings || { today: 0, this_week: 0, this_month: 0, total: 0 };
            await serviceClient
              .from('delivery_partners')
              .update({
                total_deliveries: (partnerData.total_deliveries || 0) + 1,
                earnings: {
                  today: (oldEarnings.today || 0) + partnerFee,
                  this_week: (oldEarnings.this_week || 0) + partnerFee,
                  this_month: (oldEarnings.this_month || 0) + partnerFee,
                  total: (oldEarnings.total || 0) + partnerFee,
                },
              })
              .eq('id', order.delivery_partner_id);
          }
        } catch (creditErr) {
          console.error('Failed to credit partner earnings:', creditErr);
        }
      }
    }

    const { data: updatedOrder, error: updateError } = await serviceClient
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Update status DB error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Send customer notifications on status update
    if (order.customer_id) {
      try {
        let notifTitle = '🛵 Order Update';
        let notifMsg = `Order #${orderId.slice(0, 8)} status: ${dbStatus}`;

        if (dbStatus === 'picked_up') {
          notifTitle = '🥡 Food Picked Up!';
          notifMsg = `Rider has picked up your fresh meal and is on the move.`;
        } else if (dbStatus === 'out_for_delivery') {
          notifTitle = '🚀 Out for Delivery!';
          notifMsg = `Your tiffin is on the way to your doorstep. ETA ~10-15 mins.`;
        } else if (dbStatus === 'delivered') {
          notifTitle = '✨ Order Delivered!';
          notifMsg = `Your delicious home-cooked meal has arrived. Enjoy!`;
        }

        await serviceClient.from('notifications').insert({
          user_id: order.customer_id,
          type: 'delivery',
          title: notifTitle,
          message: notifMsg,
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
    console.error('Order status endpoint error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
