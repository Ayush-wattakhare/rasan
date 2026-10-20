import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { IndianRupee } from 'lucide-react';
import { EarningsClient } from '@/components/delivery/earnings-client';
import { istPeriodStarts } from '@/lib/utils/ist-date';

export const metadata = {
  title: 'Earnings & Payouts | Rasan Delivery',
  description: 'View your delivery earnings, instant cashouts, and payment history',
};

export const dynamic = 'force-dynamic';

export default async function EarningsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'delivery') redirect('/');

  const { data: partner } = await supabase.from('delivery_partners').select('*').eq('user_id', user.id).single();
  if (!partner) redirect('/delivery-dashboard');

  // Periods in India time (the server runs in UTC), by delivery time.
  const periods = istPeriodStarts();
  // What the rider was actually credited: rider_fee (migration 008), else delivery_fee.
  const earned = (o: any) => Number(o.rider_fee ?? o.delivery_fee) || 0;

  const [recentDeliveries, periodRows, lifetime] = await Promise.all([
    (supabase.from('orders') as any)
      .select(`
        id,
        order_number,
        total,
        delivery_fee,
        rider_fee,
        created_at,
        actual_delivery_time,
        delivery_address,
        vendors:vendor_id (
          id,
          business_name,
          address
        )
      `)
      .eq('delivery_partner_id', partner.id)
      .eq('status', 'delivered')
      .order('actual_delivery_time', { ascending: false })
      .limit(50),
    (supabase.from('orders') as any)
      .select('delivery_fee, rider_fee, actual_delivery_time')
      .eq('delivery_partner_id', partner.id)
      .eq('status', 'delivered')
      .gte('actual_delivery_time', periods.month < periods.week ? periods.month : periods.week),
    // All-time totals from the IST earnings view (not just the last 50 rows).
    (supabase.from('delivery_partner_earnings_v' as any) as any)
      .select('lifetime, deliveries')
      .eq('delivery_partner_id', partner.id)
      .maybeSingle(),
  ]);

  const rows: any[] = periodRows.data || [];
  const sum = (since: string) => {
    const inPeriod = rows.filter((o) => o.actual_delivery_time && o.actual_delivery_time >= since);
    return { amount: inPeriod.reduce((s, o) => s + earned(o), 0), count: inPeriod.length };
  };
  const recent: any[] = recentDeliveries.data || [];
  const allTime = lifetime.data
    ? { amount: Number(lifetime.data.lifetime) || 0, count: Number(lifetime.data.deliveries) || 0 }
    : { amount: recent.reduce((s, o) => s + earned(o), 0), count: recent.length };

  const stats = [
    { label: 'Today', ...sum(periods.today) },
    { label: 'This Week', ...sum(periods.week) },
    { label: 'This Month', ...sum(periods.month) },
    { label: 'All Time', ...allTime },
  ];

  const mappedDeliveries = recent.map((d) => ({ ...d, delivery_fee: earned(d) }));

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-32">
      <section className="relative overflow-hidden bg-[#1A1A1A] py-12 px-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-[80px] -mr-32 -mt-32" />
        <div className="container mx-auto relative z-10 space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
            <IndianRupee className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[0.6rem] font-black text-white uppercase tracking-[0.3em] italic">Earnings Ledger</span>
          </div>
          <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter">
            MY <span className="text-orange-600">EARNINGS & PAYOUTS</span>
          </h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[0.65rem]">
            Total deliveries completed: {allTime.count}
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-8 py-10 space-y-8 -mt-6 relative z-20">
        <EarningsClient
          stats={stats}
          allDeliveries={mappedDeliveries}
          partner={partner}
        />
      </div>
    </div>
  );
}
