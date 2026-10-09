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

    const validStatuses = ['picked_up', 'out_for_delivery', 'delivered'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
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
      .select('id, order_number, status, customer_id, delivery_partner_id, tracking_updates, delivery_fee, delivery_address')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (status === 'delivered') {
      const { otp } = body;
      if (!otp) {
        return NextResponse.json(
          { error: 'Customer 4-digit Delivery PIN is required to complete handover.' },
          { status: 400 }
        );
      }
      const { verifyDeliveryOtp } = await import('@/lib/utils/delivery-otp');
      const isValid = verifyDeliveryOtp(order, otp);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Incorrect Delivery PIN. Please ask customer for the 4-digit security code shown on their tracking screen.' },
          { status: 400 }
        );
      }
    }

    const nowIso = new Date().toISOString();
    const existingUpdates = Array.isArray(order.tracking_updates) ? order.tracking_updates : [];
    const updatedTracking = [
      ...existingUpdates,
      {
        status,
        timestamp: nowIso,
        message:
          status === 'picked_up'
            ? 'Food picked up from the home kitchen.'
            : status === 'out_for_delivery'
            ? 'Out for delivery to customer destination.'
            : 'Order delivered successfully.',
      },
    ];

    const updateData: any = {
      status,
      tracking_updates: updatedTracking,
      updated_at: nowIso,
    };

    if (status === 'delivered') {
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
      console.error('Error updating delivery order status:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Send customer notifications on milestone updates
    if (order.customer_id) {
      try {
        let notifTitle = '🛵 Order Update';
        let notifMsg = `Order #${orderId.slice(0, 8)} status: ${status}`;

        if (status === 'picked_up') {
          notifTitle = '🥡 Food Picked Up!';
          notifMsg = `Rider has picked up your fresh meal from the kitchen and is on the move.`;
        } else if (status === 'out_for_delivery') {
          notifTitle = '🚀 Out for Delivery!';
          notifMsg = `Your tiffin is en route to your doorstep. ETA ~10-15 mins.`;
        } else if (status === 'delivered') {
          notifTitle = '✨ Order Delivered!';
          notifMsg = `Your delicious home-cooked meal has arrived. Bon appétit!`;
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
    console.error('Delivery status update error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}