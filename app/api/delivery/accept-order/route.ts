import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const serviceClient = createServiceClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, orderIds: rawOrderIds, deliveryPartnerId: explicitPartnerId } = body;

    const targetOrderIds: string[] = Array.isArray(rawOrderIds) && rawOrderIds.length > 0
      ? rawOrderIds
      : orderId
      ? [orderId]
      : [];

    if (targetOrderIds.length === 0) {
      return NextResponse.json({ error: 'At least one Order ID is required' }, { status: 400 });
    }

    // Limit maximum batch size to 5 orders
    const orderIds = targetOrderIds.slice(0, 5);

    // Get delivery partner ID
    let deliveryPartnerId = explicitPartnerId;
    if (!deliveryPartnerId) {
      const { data: partner } = await serviceClient
        .from('delivery_partners')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      deliveryPartnerId = partner?.id;
    }

    if (!deliveryPartnerId) {
      return NextResponse.json(
        { error: 'Delivery partner record not found' },
        { status: 404 }
      );
    }

    const nowIso = new Date().toISOString();

    // Process all orders in the batch
    for (const id of orderIds) {
      const { data: order } = await serviceClient
        .from('orders')
        .select('id, customer_id, tracking_updates')
        .eq('id', id)
        .single();

      if (order) {
        const existingUpdates = Array.isArray(order.tracking_updates) ? order.tracking_updates : [];
        const updatedTracking = [
          ...existingUpdates,
          {
            status: 'picked_up' as const,
            timestamp: nowIso,
            message: 'Delivery partner has accepted the order and picked it up from the kitchen.',
          },
        ];

        await serviceClient
          .from('orders')
          .update({
            delivery_partner_id: deliveryPartnerId,
            status: 'picked_up',
            tracking_updates: updatedTracking as any,
            updated_at: nowIso,
          })
          .eq('id', id);

        // Notify customer
        if (order.customer_id) {
          try {
            await serviceClient.from('notifications').insert({
              user_id: order.customer_id,
              type: 'delivery',
              title: '🛵 Order Assigned to Rider!',
              message: `Your tiffin for Order #${id.slice(0, 8)} is accepted by rider Rohan and heading to your location.`,
              is_read: false,
            });
          } catch {}
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully accepted ${orderIds.length} order(s)`,
      acceptedCount: orderIds.length,
      orderIds,
    });
  } catch (error: any) {
    console.error('Accept order unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}