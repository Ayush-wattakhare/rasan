import { createServiceClient } from '@/lib/supabase/server';

const ORDER_COLUMNS =
  'id, order_number, customer_id, vendor_id, delivery_partner_id, items, subtotal, delivery_fee, tax, discount, total, status, payment_status, payment_method, delivery_address, delivery_instructions, estimated_delivery_time, actual_delivery_time, tracking_updates, created_at, updated_at';

/** The handover PIN belongs to the customer; riders must never receive it. */
function withoutOtp(address: any) {
  if (!address || typeof address !== 'object') return address;
  const { delivery_otp: _otp, ...rest } = address;
  return rest;
}

type RiderPartner = { id: string; is_verified: boolean | null };

/**
 * Orders a rider may see: their own active deliveries and, once verified,
 * ready + unassigned orders. Customer contact details are only included for
 * orders assigned to the rider, and the handover PIN is always removed.
 */
export async function getRiderFeed(deliveryPartner: RiderPartner) {
  const serviceClient = createServiceClient();

  const [activeRes, availableRes] = await Promise.all([
    serviceClient
      .from('orders')
      .select(ORDER_COLUMNS)
      .eq('delivery_partner_id', deliveryPartner.id)
      .in('status', ['picked_up', 'out_for_delivery'])
      .order('created_at', { ascending: false }),
    deliveryPartner.is_verified
      ? serviceClient
          .from('orders')
          .select(ORDER_COLUMNS)
          .is('delivery_partner_id', null)
          .eq('status', 'ready')
          .order('created_at', { ascending: true })
          .limit(50)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const active = activeRes.data || [];
  // Online orders are only dispatchable once paid.
  const available = (availableRes.data || []).filter(
    (o: any) => o.payment_method === 'cash' || o.payment_status === 'paid'
  );

  const vendorIds = Array.from(new Set([...active, ...available].map((o: any) => o.vendor_id).filter(Boolean)));
  const customerIds = Array.from(new Set(active.map((o: any) => o.customer_id).filter(Boolean)));

  const [{ data: vendorsList }, { data: profilesList }] = await Promise.all([
    vendorIds.length
      ? serviceClient.from('vendors').select('id, business_name, address, phone, location').in('id', vendorIds)
      : Promise.resolve({ data: [] as any[] }),
    customerIds.length
      ? serviceClient.from('profiles').select('id, name, phone').in('id', customerIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const vendorMap = new Map((vendorsList || []).map((v: any) => [v.id, v]));
  const profileMap = new Map((profilesList || []).map((p: any) => [p.id, p]));

  const activeDeliveries = active.map((order: any) => ({
    ...order,
    delivery_address: withoutOtp(order.delivery_address),
    profiles: profileMap.get(order.customer_id) || null,
    vendors: vendorMap.get(order.vendor_id) || null,
  }));

  const availableOrders = available.map((order: any) => ({
    ...order,
    customer_id: null,
    delivery_address: withoutOtp(order.delivery_address),
    profiles: null,
    vendors: vendorMap.get(order.vendor_id) || null,
  }));

  // Cluster / bunch orders (same kitchen + same area), up to 5 per cluster
  const clustersMap: Record<string, typeof availableOrders> = {};
  for (const order of availableOrders) {
    const vendorName = order.vendors?.business_name || 'Kitchen';
    const area =
      order.delivery_address?.city ||
      order.delivery_address?.street?.split(',').pop()?.trim() ||
      'Nearby';
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
    const totalBounty = orders.reduce((sum, o) => sum + (Number(o.delivery_fee) || 0), 0);
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

  return { activeDeliveries, availableOrders, clusters };
}
