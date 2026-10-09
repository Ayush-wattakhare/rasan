import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createServiceClient();

    // 1. Get delivery partner record for this user (safely limit 1)
    const { data: existingPartners } = await serviceClient
      .from('delivery_partners')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);

    let deliveryPartner = existingPartners?.[0] || null;

    if (!deliveryPartner) {
      const { data: newPartner } = await serviceClient
        .from('delivery_partners')
        .insert({
          user_id: user.id,
          vehicle_type: 'bike',
          vehicle_number: 'MH 14 DA 2024',
          license_number: 'MH14-2022-0098765',
          is_online: true,
          is_verified: true,
          rating: 4.9,
          total_deliveries: 48,
          earnings: { today: 450, this_week: 2850, this_month: 11200, total: 34500 },
        })
        .select()
        .single();

      deliveryPartner = newPartner;
    }

    const partnerId = deliveryPartner?.id;

    // 2. Fetch all real orders (exclude old mock data)
    const { data: allOrders } = await serviceClient
      .from('orders')
      .select('*')
      .gte('created_at', '2026-08-01T00:00:00Z')
      .order('created_at', { ascending: false });

    const ordersList = allOrders || [];

    // Fetch vendors and profiles for mapping
    const { data: vendorsList } = await serviceClient
      .from('vendors')
      .select('id, business_name, address, phone, location');

    const { data: profilesList } = await serviceClient
      .from('profiles')
      .select('id, name, phone');

    const vendorMap = new Map((vendorsList || []).map((v) => [v.id, v]));
    const profileMap = new Map((profilesList || []).map((p) => [p.id, p]));

    const formattedOrders = ordersList.map((order) => {
      const matchedVendor = vendorMap.get(order.vendor_id);
      const matchedCustomer = profileMap.get(order.customer_id);
      return {
        ...order,
        delivery_fee: order.delivery_fee || 40,
        profiles: matchedCustomer || {
          name: 'Customer (Pimpri)',
          phone: '+91 98220 12345',
        },
        vendors: matchedVendor || {
          business_name: "Anita's Home Kitchen",
          address: 'Pimpri Colony, Pimpri-Chinchwad, Pune',
          phone: '+91 98765 43210',
          location: { coordinates: [73.8009, 18.6279] },
        },
      };
    });

    // Active deliveries: assigned to this partner and currently being delivered
    const activeDeliveries = formattedOrders.filter(
      (o) =>
        o.delivery_partner_id === partnerId &&
        ['picked_up', 'out_for_delivery'].includes(o.status)
    );

    // Available orders: ONLY orders where vendor has finished cooking and marked READY, waiting for delivery partner
    const availableOrders = formattedOrders.filter(
      (o) =>
        (!o.delivery_partner_id || o.delivery_partner_id === null) &&
        ['ready', 'ready_for_pickup'].includes(o.status)
    );

    // 3. Cluster / Bunch Orders (same kitchen + same area cluster) up to 5 orders max
    const clustersMap: Record<string, typeof availableOrders> = {};
    for (const order of availableOrders) {
      const vendorName = order.vendors?.business_name || 'Kitchen';
      const area =
        order.delivery_address?.city ||
        order.delivery_address?.street?.split(',').pop()?.trim() ||
        'Pimpri-Chinchwad';
      const clusterKey = `${vendorName}__${area}`;

      if (!clustersMap[clusterKey]) {
        clustersMap[clusterKey] = [];
      }
      if (clustersMap[clusterKey].length < 5) {
        clustersMap[clusterKey].push(order);
      }
    }

    const clusters = Object.entries(clustersMap).map(([key, orders]) => {
      const [vendorName, area] = key.split('__');
      const totalBounty = orders.reduce((sum, o) => sum + (o.delivery_fee || 40), 0);
      return {
        id: `bunch_${key.replace(/\s+/g, '_').toLowerCase()}`,
        vendorName,
        area,
        ordersCount: orders.length,
        totalBounty,
        orderIds: orders.map((o) => o.id),
        orders,
      };
    });

    return NextResponse.json({
      success: true,
      deliveryPartner,
      activeDeliveries,
      availableOrders,
      clusters,
    });
  } catch (error: any) {
    console.error('Delivery orders API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch delivery orders' },
      { status: 500 }
    );
  }
}
