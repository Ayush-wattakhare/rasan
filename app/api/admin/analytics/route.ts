import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/guards';
import { revenueSummary } from '@/lib/analytics/revenue';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2})?)?$/;

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const searchParams = request.nextUrl.searchParams;
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  if ((dateFrom && !ISO_DATE.test(dateFrom)) || (dateTo && !ISO_DATE.test(dateTo))) {
    return NextResponse.json({ error: 'Dates must be ISO formatted (YYYY-MM-DD)' }, { status: 400 });
  }

  try {
    const db = createServiceClient();
    let ordersQuery = (db.from('orders') as any).select(
      'status, payment_status, payment_method, total, subtotal, tax, refunded_amount, created_at'
    );
    if (dateFrom) ordersQuery = ordersQuery.gte('created_at', dateFrom);
    if (dateTo) ordersQuery = ordersQuery.lte('created_at', dateTo);

    const [
      { data: orders, error: ordersError },
      { count: totalUsers },
      { count: totalVendors },
      { count: totalDeliveryPartners },
    ] = await Promise.all([
      ordersQuery,
      db.from('profiles').select('id', { count: 'exact', head: true }),
      db.from('vendors').select('id', { count: 'exact', head: true }),
      db.from('delivery_partners').select('id', { count: 'exact', head: true }),
    ]);
    if (ordersError) throw ordersError;

    const rows = (orders || []) as any[];
    const summary = revenueSummary(rows);
    const ordersByStatus = rows.reduce((acc: Record<string, number>, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalVendors: totalVendors || 0,
      totalDeliveryPartners: totalDeliveryPartners || 0,
      totalOrders: rows.length,
      completedOrders: summary.orders,
      totalRevenue: summary.grossRevenue,
      platformEarnings: summary.platformEarnings,
      vendorPayouts: summary.vendorShare,
      averageOrderValue: summary.averageOrderValue,
      ordersByStatus,
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
