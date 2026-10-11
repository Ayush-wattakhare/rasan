import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RASAN_COMMISSION_PERCENTAGE, RASAN_COMMISSION_RATE } from '@/lib/utils/constants';
import { IndianRupee } from 'lucide-react';
import { VendorPayoutsClient } from '@/components/vendor/vendor-payouts-client';

export const metadata = {
  title: 'Payouts & Earnings | Rasan Vendor',
  description: 'Track your earnings, manage UPI & bank details, and redeem payouts',
};

export const dynamic = 'force-dynamic';

export default async function PayoutsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const serviceClient = createServiceClient();

  const { data: vendors } = await serviceClient
    .from('vendors')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const vendor = vendors && vendors.length > 0 ? vendors[0] : null;

  // Vendor records are created through the application form and approved by an admin.
  if (!vendor) {
    redirect('/become-vendor');
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const ordersQuery = serviceClient
    .from('orders')
    .select('id, total, status, created_at')
    .eq('vendor_id', vendor.id)
    .eq('status', 'delivered')
    .order('created_at', { ascending: false });

  const { data: rawOrders } = await ordersQuery;
  const allDeliveredOrders = rawOrders || [];

  const todayOrders = allDeliveredOrders.filter((o) => o.created_at >= startOfToday);
  const weekOrders = allDeliveredOrders.filter((o) => o.created_at >= startOfWeek);
  const monthOrders = allDeliveredOrders.filter((o) => o.created_at >= startOfMonth);

  const PLATFORM_FEE = RASAN_COMMISSION_RATE;
  const calc = (orders: any[]) => {
    const gross = orders.reduce((s, o) => s + (o.total || 0), 0);
    return { gross, fee: gross * PLATFORM_FEE, net: gross * (1 - PLATFORM_FEE), count: orders.length };
  };

  const today = calc(todayOrders);
  const week = calc(weekOrders);
  const month = calc(monthOrders);
  const all = calc(allDeliveredOrders);

  // Same rule as request_payout(): earlier non-rejected payouts reduce the balance.
  const { data: previousPayouts } = await serviceClient
    .from('payouts')
    .select('amount, status')
    .eq('user_id', user.id)
    .eq('payee_type', 'vendor')
    .neq('status', 'rejected');
  const requestedPayouts = (previousPayouts || []).reduce((s, p) => s + Number(p.amount || 0), 0);

  const stats = [
    { label: 'Today', ...today },
    { label: 'This Week', ...week },
    { label: 'This Month', ...month },
    { label: 'All Time', ...all },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-32">
      {/* Header */}
      <section className="relative overflow-hidden bg-[#1A1A1A] py-12 px-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="container mx-auto relative z-10 space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
            <IndianRupee className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[0.6rem] font-black text-white uppercase tracking-[0.3em] italic">Revenue Terminal</span>
          </div>
          <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter">
            PAYOUTS & <span className="text-orange-600">EARNINGS</span>
          </h1>
          <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[0.65rem]">
            {vendor.business_name} • Platform fee: {RASAN_COMMISSION_PERCENTAGE}% • UPI & Bank Settlements
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-8 py-10 space-y-8 -mt-6 relative z-20">
        <VendorPayoutsClient
          stats={stats}
          allOrders={allDeliveredOrders}
          vendor={vendor}
          platformFeePct={PLATFORM_FEE}
          requestedPayouts={requestedPayouts}
        />
      </div>
    </div>
  );
}
