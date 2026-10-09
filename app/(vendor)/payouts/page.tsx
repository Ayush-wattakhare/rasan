import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
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

  let vendor = vendors && vendors.length > 0 ? vendors[0] : null;

  if (!vendor) {
    const defaultHours: any = {
      monday: { open_time: '09:00', close_time: '21:00', is_open: true },
      tuesday: { open_time: '09:00', close_time: '21:00', is_open: true },
      wednesday: { open_time: '09:00', close_time: '21:00', is_open: true },
      thursday: { open_time: '09:00', close_time: '21:00', is_open: true },
      friday: { open_time: '09:00', close_time: '21:00', is_open: true },
      saturday: { open_time: '09:00', close_time: '21:00', is_open: true },
      sunday: { open_time: '09:00', close_time: '21:00', is_open: true },
    };

    const { data: newVendor } = await serviceClient
      .from('vendors')
      .insert({
        user_id: user.id,
        business_name: user.user_metadata?.name || 'Home Kitchen',
        cuisine: ['Indian'],
        address: 'Pune, Maharashtra',
        phone: user.user_metadata?.phone || '',
        email: user.email || '',
        location: 'POINT(73.8567 18.5204)' as any,
        operating_hours: defaultHours,
        is_active: true,
        rating: 5.0,
        total_orders: 0,
      } as any)
      .select()
      .single();
    vendor = newVendor;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Get orders for this vendor or demo fallback
  let ordersQuery = serviceClient
    .from('orders')
    .select('id, total, status, created_at')
    .eq('status', 'delivered')
    .order('created_at', { ascending: false });

  if (vendor?.id) {
    ordersQuery = serviceClient
      .from('orders')
      .select('id, total, status, created_at')
      .eq('vendor_id', vendor.id)
      .eq('status', 'delivered')
      .order('created_at', { ascending: false });
  } else {
    ordersQuery = serviceClient
      .from('orders')
      .select('id, total, status, created_at')
      .eq('id', '00000000-0000-0000-0000-000000000000');
  }

  const { data: rawOrders } = await ordersQuery;
  const allDeliveredOrders = rawOrders || [];

  const todayOrders = allDeliveredOrders.filter((o) => o.created_at >= startOfToday);
  const weekOrders = allDeliveredOrders.filter((o) => o.created_at >= startOfWeek);
  const monthOrders = allDeliveredOrders.filter((o) => o.created_at >= startOfMonth);

  const PLATFORM_FEE = 0.1; // 10%
  const calc = (orders: any[]) => {
    const gross = orders.reduce((s, o) => s + (o.total || 0), 0);
    return { gross, fee: gross * PLATFORM_FEE, net: gross * (1 - PLATFORM_FEE), count: orders.length };
  };

  const today = calc(todayOrders);
  const week = calc(weekOrders);
  const month = calc(monthOrders);
  const all = calc(allDeliveredOrders);

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
            {vendor?.business_name || 'Home Kitchen'} • Platform fee: 10% • Instant UPI & Bank Settlements
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-8 py-10 space-y-8 -mt-6 relative z-20">
        <VendorPayoutsClient
          stats={stats}
          allOrders={allDeliveredOrders}
          vendor={vendor!}
          platformFeePct={PLATFORM_FEE}
        />
      </div>
    </div>
  );
}
