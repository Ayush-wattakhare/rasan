import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');

  try {
    let ordersQuery = supabase.from('orders').select('*');
    
    if (dateFrom) {
      ordersQuery = ordersQuery.gte('created_at', dateFrom);
    }
    if (dateTo) {
      ordersQuery = ordersQuery.lte('created_at', dateTo);
    }

    const [
      { data: orders },
      { count: totalUsers },
      { count: totalVendors },
      { count: totalDeliveryPartners },
    ] = await Promise.all([
      ordersQuery,
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('vendors').select('id', { count: 'exact', head: true }),
      supabase.from('delivery_partners').select('id', { count: 'exact', head: true }),
    ]);

    const totalRevenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
    const totalOrders = orders?.length || 0;

    const ordersByStatus = orders?.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalVendors: totalVendors || 0,
      totalDeliveryPartners: totalDeliveryPartners || 0,
      totalOrders,
      totalRevenue,
      ordersByStatus,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
