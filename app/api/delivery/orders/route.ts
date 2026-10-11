import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { getRiderFeed } from '@/lib/delivery/rider-feed';

/**
 * Rider feed: the caller's active deliveries plus ready, unassigned orders.
 * Unverified riders see no open orders. Customer contact details are only
 * included for orders assigned to the caller.
 */
export async function GET() {
  const auth = await requireRole('delivery');
  if (!auth.ok) return auth.response;

  try {
    const serviceClient = createServiceClient();

    const { data: deliveryPartner } = await serviceClient
      .from('delivery_partners')
      .select('id, user_id, vehicle_type, vehicle_number, is_online, is_verified, rating, total_deliveries, earnings, created_at')
      .eq('user_id', auth.user.id)
      .maybeSingle();

    if (!deliveryPartner) {
      return NextResponse.json({
        success: true,
        deliveryPartner: null,
        needsApplication: true,
        activeDeliveries: [],
        availableOrders: [],
        clusters: [],
      });
    }

    const { activeDeliveries, availableOrders, clusters } = await getRiderFeed(deliveryPartner);

    return NextResponse.json({
      success: true,
      deliveryPartner,
      activeDeliveries,
      availableOrders,
      clusters,
    });
  } catch (error) {
    console.error('Delivery orders API error:', error);
    return NextResponse.json({ error: 'Failed to fetch delivery orders' }, { status: 500 });
  }
}
