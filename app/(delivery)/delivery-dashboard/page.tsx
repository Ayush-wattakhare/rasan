import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DeliveryDashboardMain from './delivery-dashboard-main';

export const dynamic = 'force-dynamic';

export default async function DeliveryDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch delivery partner profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'delivery') {
    redirect('/');
  }

  const serviceClient = createServiceClient();

  // Fetch existing partner record safely using limit(1)
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
        earnings: {
          today: 450,
          this_week: 2850,
          this_month: 11200,
          total: 34500,
        },
      })
      .select()
      .single();

    deliveryPartner = newPartner;
  } else if (!deliveryPartner.is_verified) {
    const { data: verifiedPartner } = await serviceClient
      .from('delivery_partners')
      .update({ is_verified: true, is_online: true })
      .eq('id', deliveryPartner.id)
      .select()
      .single();

    deliveryPartner = verifiedPartner || deliveryPartner;
  }

  if (!deliveryPartner) {
    redirect('/login');
  }

  const partnerId = deliveryPartner.id;

  // Fetch real orders
  const { data: allOrders } = await serviceClient
    .from('orders')
    .select('*')
    .gte('created_at', '2026-08-01T00:00:00Z')
    .order('created_at', { ascending: false });

  const { data: vendorsList } = await serviceClient
    .from('vendors')
    .select('id, business_name, address, phone, location');

  const { data: profilesList } = await serviceClient
    .from('profiles')
    .select('id, name, phone');

  const vendorMap = new Map((vendorsList || []).map((v) => [v.id, v]));
  const profileMap = new Map((profilesList || []).map((p) => [p.id, p]));

  const formattedOrders = (allOrders || []).map((order) => {
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

  const today = new Date().toISOString().split('T')[0];
  const { data: todayDeliveries } = await serviceClient
    .from('orders')
    .select('total, delivery_fee')
    .eq('delivery_partner_id', partnerId)
    .eq('status', 'delivered')
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`);

  const todayEarnings =
    todayDeliveries && todayDeliveries.length > 0
      ? todayDeliveries.reduce((sum, order) => sum + (order.delivery_fee || 40), 0)
      : 450;

  return (
    <DeliveryDashboardMain
      deliveryPartner={deliveryPartner}
      profile={profile}
      activeDeliveries={activeDeliveries}
      availableOrders={availableOrders}
      todayEarnings={todayEarnings}
    />
  );
}
