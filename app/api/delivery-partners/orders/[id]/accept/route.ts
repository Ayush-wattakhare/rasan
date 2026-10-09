import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: orderId } = await params;
    const body = await request.json();
    const { delivery_partner_id } = body;

    // Verify delivery partner ownership
    const { data: deliveryPartner } = await supabase
      .from('delivery_partners')
      .select('*')
      .eq('id', delivery_partner_id)
      .eq('user_id', user.id)
      .single();

    if (!deliveryPartner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!deliveryPartner.is_online || !deliveryPartner.is_verified) {
      return NextResponse.json(
        { error: 'Delivery partner must be online and verified' },
        { status: 400 }
      );
    }

    // Check if order is still available
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.delivery_partner_id) {
      return NextResponse.json(
        { error: 'Order already assigned' },
        { status: 400 }
      );
    }

    if (order.status !== 'ready_for_pickup' && order.status !== 'ready') {
      return NextResponse.json(
        { error: 'Order is not ready for pickup' },
        { status: 400 }
      );
    }

    // Assign delivery partner to order
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({
        delivery_partner_id,
        status: 'picked_up',
        tracking_updates: [
          ...(order.tracking_updates || []),
          {
            status: 'picked_up',
            timestamp: new Date().toISOString(),
            location: undefined,
            note: 'Order picked up by delivery partner',
          },
        ] as any,
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error accepting order:', error);
      return NextResponse.json(
        { error: 'Failed to accept order' },
        { status: 500 }
      );
    }

    // Send notification to customer
    await supabase.from('notifications').insert({
      user_id: order.customer_id,
      type: 'delivery',
      title: 'Order Picked Up',
      message: `Your order #${order.order_number} has been picked up and is on the way!`,
      data: { order_id: orderId },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error in POST /api/delivery-partners/orders/[id]/accept:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
