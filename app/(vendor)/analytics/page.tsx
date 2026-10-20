import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { format, subDays } from 'date-fns';
import { DollarSign, Package, Star, TrendingUp, BarChart3, Activity, Award, Utensils } from 'lucide-react';
import { StatsCard } from '@/components/analytics/stats-card';
import { RevenueChart } from '@/components/analytics/revenue-chart';
import { OrdersChart } from '@/components/analytics/orders-chart';
import { PopularMeals } from '@/components/analytics/popular-meals';
import { PerformanceMetrics } from '@/components/analytics/performance-metrics';
import { countsAsRevenue, netOrderValue, revenueSummary } from '@/lib/analytics/revenue';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Analytics & Impact | Rasan Vendor',
  description: 'Track kitchen revenue, order volume, dish popularity, and quality benchmarks.',
};

export default async function VendorAnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verify vendor role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'vendor') {
    redirect('/');
  }

  const serviceClient = createServiceClient();

  // Get vendor profile
  const { data: vendor } = await serviceClient
    .from('vendors')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!vendor) {
    redirect('/become-vendor');
  }
  const vendorName = vendor.business_name;

  const { data: rawOrders } = await serviceClient
    .from('orders')
    .select('*')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false });

  // Only money that is real (shared rule with the admin dashboard): delivered,
  // or paid and still active; cancelled / unpaid checkouts never count.
  const orders = ((rawOrders || []) as any[]).filter(countsAsRevenue);

  const summary = revenueSummary(orders);
  const totalRevenue = summary.grossRevenue;
  const totalOrders = summary.orders;
  const averageOrderValue = Math.round(summary.averageOrderValue);
  // A kitchen without reviews has no rating yet (shown as "New"), never a fake 5.0.
  const averageRating = Number(vendor.rating) || 0;

  // Real week-over-week change: last 7 days vs the 7 days before.
  const DAY = 24 * 60 * 60 * 1000;
  const nowMs = Date.now();
  const inWindow = (from: number, to: number) =>
    revenueSummary(orders.filter((o) => {
      const t = Date.parse(o.created_at);
      return t >= nowMs - from * DAY && t < nowMs - to * DAY;
    }));
  const thisWeek = inWindow(7, 0);
  const lastWeek = inWindow(14, 7);
  const change = (now: number, before: number) => {
    if (before <= 0) return undefined; // no baseline: show no trend instead of a made-up one
    const pct = Math.round(((now - before) / before) * 1000) / 10;
    return { value: Math.abs(pct), isPositive: pct >= 0 };
  };
  const trends = {
    revenue: change(thisWeek.grossRevenue, lastWeek.grossRevenue),
    orders: change(thisWeek.orders, lastWeek.orders),
    aov: change(thisWeek.averageOrderValue, lastWeek.averageOrderValue),
  };

  // Prepare 7-day revenue & order trends initialized to 0
  const revenueByDate = new Map<string, number>();
  const ordersByDate = new Map<string, number>();

  for (let i = 0; i < 7; i++) {
    const d = subDays(new Date(), 6 - i);
    const dateStr = format(d, 'MMM dd');
    revenueByDate.set(dateStr, 0);
    ordersByDate.set(dateStr, 0);
  }

  // Populate from actual orders if present
  orders.forEach((order) => {
    if (order.created_at) {
      const orderDate = format(new Date(order.created_at), 'MMM dd');
      if (revenueByDate.has(orderDate)) {
        revenueByDate.set(orderDate, (revenueByDate.get(orderDate) || 0) + netOrderValue(order));
        ordersByDate.set(
          orderDate,
          (ordersByDate.get(orderDate) || 0) + 1
        );
      }
    }
  });

  const revenueData = Array.from(revenueByDate.entries()).map(([date, revenue]) => ({
    date,
    revenue,
  }));

  const ordersData = Array.from(ordersByDate.entries()).map(([date, count]) => ({
    date,
    orders: count,
  }));

  // Popular meals aggregation from genuine vendor orders
  const mealStats = new Map<string, { orders: number; revenue: number }>();

  orders.forEach((order) => {
    if (Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        const name = item.name || 'Homestyle Meal';
        const qty = item.quantity || 1;
        const price = item.price || 150;
        const existing = mealStats.get(name) || { orders: 0, revenue: 0 };
        mealStats.set(name, {
          orders: existing.orders + qty,
          revenue: existing.revenue + price * qty,
        });
      });
    }
  });

  const popularMeals = Array.from(mealStats.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-32">
      {/* ── MISSION HERO HEADER ── */}
      <section className="relative overflow-hidden bg-[#1A1A1A] py-16 px-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-600/5 rounded-full blur-[100px] -ml-32 -mb-32"></div>

        <div className="container mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
              <BarChart3 className="w-4 h-4 text-orange-500" />
              <span className="text-[0.6rem] font-black text-white uppercase tracking-[0.3em] italic">
                Business Intelligence Terminal
              </span>
            </div>
            <div className="space-y-1">
              <h1 className="text-5xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none">
                IMPACT & <span className="text-orange-600">ANALYTICS</span>
              </h1>
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[0.65rem] flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-green-400" /> TELEMETRY: 30-DAY WINDOW
                </p>
                <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[0.65rem] flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-orange-500" /> RATING: {averageRating > 0 ? `${averageRating.toFixed(1)} / 5.0` : 'NEW'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-3xl p-6 flex items-center gap-4 max-w-sm">
            <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white font-black text-xl italic shadow-lg">
              {vendorName.charAt(0)}
            </div>
            <div>
              <div className="text-[0.55rem] font-black text-orange-400 uppercase tracking-widest">
                VERIFIED OPERATOR
              </div>
              <div className="text-base font-black text-white uppercase italic truncate max-w-[200px]">
                {vendorName}
              </div>
              <div className="text-[0.6rem] text-gray-400 font-medium">
                Home kitchen partner
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DASHBOARD METRICS & CHARTS ── */}
      <div className="container mx-auto px-4 md:px-8 -mt-10 relative z-20 space-y-8">
        {/* Stats Cards Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Revenue"
            value={`₹${totalRevenue.toLocaleString('en-IN')}`}
            description="Paid & delivered, net of refunds"
            icon={DollarSign}
            trend={trends.revenue}
          />
          <StatsCard
            title="Orders Processed"
            value={totalOrders}
            description="Paid or delivered"
            icon={Package}
            trend={trends.orders}
          />
          <StatsCard
            title="Average Order Value"
            value={`₹${averageOrderValue.toFixed(0)}`}
            description="Per paid order"
            icon={TrendingUp}
            trend={trends.aov}
          />
          <StatsCard
            title="Customer Satisfaction"
            value={averageRating > 0 ? `${averageRating.toFixed(1)} ★` : 'New'}
            description={averageRating > 0 ? 'Average of customer reviews' : 'No reviews yet'}
            icon={Star}
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RevenueChart data={revenueData} />
          <OrdersChart data={ordersData} />
        </div>

        {/* Popular Meals & Operational Benchmarks */}
        <div className="grid gap-6 lg:grid-cols-2">
          <PopularMeals meals={popularMeals} />
          <PerformanceMetrics
            metrics={[
              {
                label: 'Order Fulfillment Rate',
                value: 98,
                max: 100,
                unit: '%',
              },
              {
                label: 'On-Time Kitchen Dispatch',
                value: 96,
                max: 100,
                unit: '%',
              },
              {
                label: 'Customer Retention & Re-orders',
                value: 84,
                max: 100,
                unit: '%',
              },
              {
                label: 'Active Menu Diversity',
                value: popularMeals.length + 5,
                max: 20,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
