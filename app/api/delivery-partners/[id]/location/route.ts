import { createClient, createServiceClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/guards';
import type { UserRole } from '@/types';

async function canViewPartnerLocation(partnerId: string, userId: string, role: UserRole | null) {
  if (role === 'admin') return true;
  const serviceClient = createServiceClient();

  const { data: partner } = await serviceClient
    .from('delivery_partners')
    .select('user_id')
    .eq('id', partnerId)
    .maybeSingle();
  if (partner?.user_id === userId) return true;

  const { data: activeOrder } = await serviceClient
    .from('orders')
    .select('id')
    .eq('delivery_partner_id', partnerId)
    .eq('customer_id', userId)
    .in('status', ['picked_up', 'out_for_delivery'])
    .limit(1)
    .maybeSingle();
  return !!activeOrder;
}
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    // Live location is visible to the rider, admins, and customers whose order
    // this rider is currently delivering.
    if (!(await canViewPartnerLocation(id, auth.user.id, auth.role))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: partner, error } = await createServiceClient()
      .from('delivery_partners')
      .select('id, is_online, current_location, updated_at')
      .eq('id', id)
      .single();

    if (error || !partner) {
      // Return default location if partner record not yet synced
      return NextResponse.json({
        success: true,
        partner_id: id,
        is_online: true,
        lat: 18.6279,
        lng: 73.8009,
        updated_at: new Date().toISOString(),
      });
    }

    let lat: number | null = null;
    let lng: number | null = null;
    if (partner.current_location) {
      const loc = partner.current_location as any;
      if (typeof loc === 'string') {
        const match = loc.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
        if (match) {
          lng = parseFloat(match[1]);
          lat = parseFloat(match[2]);
        }
      } else if (Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
        lng = loc.coordinates[0];
        lat = loc.coordinates[1];
      } else if (typeof loc.lat === 'number' && typeof loc.lng === 'number') {
        lat = loc.lat;
        lng = loc.lng;
      }
    }

    return NextResponse.json({
      success: true,
      partner_id: partner.id,
      is_online: partner.is_online,
      lat: lat ?? 18.6279,
      lng: lng ?? 73.8009,
      updated_at: partner.updated_at,
    });
  } catch (error: any) {
    console.error('Error in GET /api/delivery-partners/[id]/location:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const { id } = await params;
    const body = await request.json();
    const { lat, lng } = body;

    // Validate coordinates
    if (
      typeof lat !== 'number' ||
      typeof lng !== 'number' ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: deliveryPartner } = await supabase
      .from('delivery_partners')
      .select('user_id, is_online')
      .eq('id', id)
      .single();

    if (!deliveryPartner || deliveryPartner.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!deliveryPartner.is_online) {
      return NextResponse.json(
        { error: 'Delivery partner must be online to update location' },
        { status: 400 }
      );
    }

    // Update location using PostGIS point
    // (WKT POINT(lng lat); the rider may write current_location on their own row)
    const { error } = await supabase
      .from('delivery_partners')
      .update({
        current_location: `POINT(${lng} ${lat})` as any,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating delivery partner location:', error);
      return NextResponse.json(
        { error: 'Failed to update location' },
        { status: 500 }
      );
    }

    // Broadcast location update to customers with active orders
    const { data: activeOrders } = await supabase
      .from('orders')
      .select('id, customer_id, delivery_address')
      .eq('delivery_partner_id', id)
      .in('status', ['picked_up', 'out_for_delivery']);

    if (activeOrders && activeOrders.length > 0) {
      // Emit real-time location update
      const channel = supabase.channel('delivery-tracking');
      for (const order of activeOrders) {
        await channel.send({
          type: 'broadcast',
          event: 'location_update',
          payload: {
            order_id: order.id,
            location: { lat, lng },
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    return NextResponse.json({ success: true, location: { lat, lng } });
  } catch (error) {
    console.error('Error in PUT /api/delivery-partners/[id]/location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
