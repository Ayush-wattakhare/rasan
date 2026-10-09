import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { IndianRupee } from 'lucide-react';
import { EarningsClient } from '@/components/delivery/earnings-client';

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

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [allDeliveries, todayD, weekD, monthD] = await Promise.all([
    supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total,
        delivery_fee,
        created_at,
        delivery_address,
        vendors:vendor_id (
          id,
          business_name,
          address
        )
      `)
      .eq('delivery_partner_id', partner.id)
      .eq('status', 'delivered')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('orders').select('delivery_fee').eq('delivery_partner_id', partner.id).eq('status', 'delivered').gte('created_at', todayStart),
    supabase.from('orders').select('delivery_fee').eq('delivery_partner_id', partner.id).eq('status', 'delivered').gte('created_at', weekStart),
    supabase.from('orders').select('delivery_fee').eq('delivery_partner_id', partner.id).eq('status', 'delivered').gte('created_at', monthStart),
  ]);

  const sum = (orders: any[] | null) => ({
    amount: (orders || []).reduce((s, o) => s + Math.max(Number(o.delivery_fee) || 0, 35), 0),
    count: (orders || []).length,
  });

  const stats = [
    { label: 'Today', ...sum(todayD.data) },
    { label: 'This Week', ...sum(weekD.data) },
    { label: 'This Month', ...sum(monthD.data) },
    { label: 'All Time', ...sum(allDeliveries.data) },
  ];

  const mappedDeliveries = (allDeliveries.data || []).map((d) => ({
    ...d,
    delivery_fee: Math.max(Number(d.delivery_fee) || 0, 35),
  }));

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
            Total deliveries completed: {sum(allDeliveries.data).count} • Instant Cashout Enabled
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
