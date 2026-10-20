import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { createServiceClient } from '@/lib/supabase/server';
import { sweepUnpaidOrders } from '@/lib/orders/stock';

const IN_FLIGHT = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'out_for_delivery'] as const;

/** Minutes after which an order in this status counts as delayed. */
const DELAY_MINUTES: Record<string, number> = {
  pending: 15,
  confirmed: 30,
  preparing: 45,
  ready: 20,
  picked_up: 45,
  out_for_delivery: 45,
};

/** When the order entered its current status (from tracking_updates), else created_at. */
function statusSince(order: any): number {
  const updates = Array.isArray(order.tracking_updates) ? order.tracking_updates : [];
  for (let i = updates.length - 1; i >= 0; i--) {
    if (updates[i]?.status === order.status && updates[i]?.timestamp) {
      const t = Date.parse(updates[i].timestamp);
      if (Number.isFinite(t)) return t;
    }
  }
  return Date.parse(order.created_at);
}

/**
 * Live orders for admin operations, with real kitchen, rider and customer
 * details. GET ?scope=in_flight (default) | all
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  await sweepUnpaidOrders();

  const scope = request.nextUrl.searchParams.get('scope') === 'all' ? 'all' : 'in_flight';
  let query = (createServiceClient().from('orders') as any)
    .select(
      `id, order_number, status, payment_status, payment_method, total, created_at, updated_at,
       delivery_address, tracking_updates, vendor_id, delivery_partner_id,
       vendors:vendor_id(business_name, phone),
       customer:profiles(name, phone),
       rider:delivery_partners(id, vehicle_number, user:profiles(name, phone))`
    )
    .order('created_at', { ascending: false })
    .limit(scope === 'all' ? 200 : 150);

  if (scope === 'in_flight') {
    query = query.in('status', IN_FLIGHT as unknown as string[]);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Admin orders fetch failed:', error);
    return NextResponse.json({ error: 'Could not load orders' }, { status: 500 });
  }

  const now = Date.now();
  const orders = (data || [])
    // Unpaid online checkouts are not live work for the kitchen yet.
    .filter((o: any) => !(o.payment_method !== 'cash' && o.status === 'pending' && o.payment_status !== 'paid'))
    .map((o: any) => {
      const minutesInStatus = Math.max(0, Math.round((now - statusSince(o)) / 60000));
      const limit = DELAY_MINUTES[o.status];
      return {
        id: o.id,
        order_number: o.order_number,
        status: o.status,
        payment_status: o.payment_status,
        payment_method: o.payment_method,
        total: Number(o.total),
        created_at: o.created_at,
        delivery_address: o.delivery_address,
        vendor_id: o.vendor_id,
        delivery_partner_id: o.delivery_partner_id,
        kitchen_name: o.vendors?.business_name ?? 'Unknown kitchen',
        kitchen_phone: o.vendors?.phone ?? null,
        customer_name: o.customer?.name ?? null,
        customer_phone: o.customer?.phone ?? o.delivery_address?.phone ?? null,
        rider_name: o.rider?.user?.name ?? null,
        rider_phone: o.rider?.user?.phone ?? null,
        rider_vehicle: o.rider?.vehicle_number ?? null,
        minutes_in_status: minutesInStatus,
        is_delayed: limit !== undefined && minutesInStatus > limit,
      };
    });

  return NextResponse.json({ success: true, orders });
}
