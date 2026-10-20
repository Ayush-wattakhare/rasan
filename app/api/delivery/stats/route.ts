import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { istPeriodStarts } from '@/lib/utils/ist-date';

const ACTIVE = ['picked_up', 'out_for_delivery'];

/** Rider stats in India time, by delivery time, using what the rider earned. */
export async function GET() {
  const auth = await requireRole('delivery');
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;

  try {
    const { data: deliveryPartner } = await supabase
      .from('delivery_partners')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!deliveryPartner) {
      return NextResponse.json({ error: 'Delivery partner not found' }, { status: 404 });
    }

    const periods = istPeriodStarts();
    const since = periods.month < periods.week ? periods.month : periods.week;
    const [{ data: delivered }, { count: activeOrders }] = await Promise.all([
      (supabase.from('orders') as any)
        .select('delivery_fee, rider_fee, actual_delivery_time')
        .eq('delivery_partner_id', deliveryPartner.id)
        .eq('status', 'delivered')
        .gte('actual_delivery_time', since),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('delivery_partner_id', deliveryPartner.id)
        .in('status', ACTIVE as any),
    ]);

    const rows: any[] = delivered || [];
    const earned = (o: any) => Number(o.rider_fee ?? o.delivery_fee) || 0;
    const period = (start: string) => {
      const list = rows.filter((o) => o.actual_delivery_time >= start);
      return { deliveries: list.length, earnings: list.reduce((s, o) => s + earned(o), 0) };
    };

    return NextResponse.json({
      success: true,
      stats: {
        today: { ...period(periods.today), activeOrders: activeOrders || 0 },
        week: period(periods.week),
        month: period(periods.month),
        overall: {
          rating: deliveryPartner.rating,
          totalDeliveries: deliveryPartner.total_deliveries,
          // Withdrawable balance (payouts already deducted).
          totalEarnings: (deliveryPartner.earnings as any)?.total || 0,
          isOnline: deliveryPartner.is_online,
          vehicleType: deliveryPartner.vehicle_type,
          vehicleNumber: deliveryPartner.vehicle_number,
        },
      },
    });
  } catch (error) {
    console.error('Delivery stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
