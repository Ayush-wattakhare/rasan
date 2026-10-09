import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

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

    const { data: order, error: orderError } = await serviceClient
      .from('orders')
      .select('id, customer_id, status, total, estimated_delivery_time, created_at')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Must be owner or admin
    if (order.customer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (order.status !== 'delivered') {
      return NextResponse.json(
        { error: 'Late delivery compensation is only applicable after order delivery' },
        { status: 400 }
      );
    }

    // Calculate delay: if estimated delivery time was exceeded by > 15 minutes
    const createdTime = new Date(order.created_at).getTime();
    const estimatedMinutes = parseInt(order.estimated_delivery_time || '35', 10) || 35;
    const expectedDeliveryTime = createdTime + estimatedMinutes * 60 * 1000;
    const actualDeliveryTime = Date.now();

    const delayMinutes = Math.round((actualDeliveryTime - expectedDeliveryTime) / 60000);

    if (delayMinutes < 15) {
      return NextResponse.json({
        eligible: false,
        message: `Order was delivered within acceptable window (${delayMinutes}m delay). Compensation threshold is >15m.`,
      });
    }

    // Issue 15% late compensation credit
    const compensationAmount = (order.total * 15) / 100;

    // Send compensation notification
    await serviceClient.from('notifications').insert({
      user_id: order.customer_id,
      type: 'order',
      title: 'Late Delivery Compensation Issued ⏱️',
      message: `Your order delivered ${delayMinutes} mins late. A 15% late compensation credit of ₹${compensationAmount.toFixed(2)} has been granted to your account!`,
      is_read: false,
    });

    return NextResponse.json({
      eligible: true,
      success: true,
      delayMinutes,
      compensationAmount,
      message: `Late delivery compensation of ₹${compensationAmount.toFixed(2)} issued successfully!`,
    });
  } catch (error: any) {
    console.error('Late compensation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
