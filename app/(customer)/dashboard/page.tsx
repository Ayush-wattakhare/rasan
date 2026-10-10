import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Sparkles } from 'lucide-react';
import TopMealsSection from './top-meals-section';
import CustomerSearch from './customer-search';
import HighestRatedVendors from '@/components/home/highest-rated-vendors';
import { EmbeddedKitchenCircle } from '@/components/subscriptions/embedded-kitchen-circle';

export default async function CustomerDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch customer's active subscription if any
  const { data: customerSub } = await supabase
    .from('subscriptions')
    .select(`
      *,
      vendors:vendor_id (
        id,
        business_name,
        cuisine,
        rating
      )
    `)
    .eq('customer_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch top rated meals from verified proper vendors only
  const { data: topMeals } = await supabase
    .from('meals')
    .select(`
      *,
      vendors!inner (
        id,
        business_name,
        rating,
        is_active
      )
    `)
    .eq('is_available', true)
    .eq('vendors.is_active', true)
    .not('vendors.business_name', 'ilike', '%test%')
    .order('rating', { ascending: false })
    .limit(8);

  // Only active subscribers of a weekly/monthly tiffin plan get access to Kitchen Circle & Tomorrow's Menu
  const hasActiveSubscription = !!customerSub && customerSub.status === 'active';
  const activeVendorId = hasActiveSubscription ? (customerSub?.vendors?.id || customerSub?.vendor_id) : null;
  const activeVendorName = customerSub?.vendors?.business_name || 'Your Chef';
  const customerName = profile?.name?.split(' ')[0] || profile?.email?.split('@')[0] || 'Foodie';

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Sleek, Compact Food Dashboard Header (< 140px vertical height) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1A1A1A] via-[#241E1C] to-[#1A1A1A] border-b border-white/5 py-4 md:py-6">
        <div className="absolute top-0 right-0 w-72 h-72 bg-orange-500/10 rounded-full blur-[90px] -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none"></div>
        
        <div className="container mx-auto px-4 relative z-10 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left greeting & actions */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/25 text-orange-400 text-[11px] font-bold">
                <span>🍲</span>
                <span>Authentic Home Kitchens • Fresh Daily</span>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                Craving homemade food, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300 capitalize">{customerName}</span>? 👋
              </h1>
              <p className="text-xs md:text-sm text-gray-300 font-medium max-w-xl">
                Fresh tiffins, authentic regional curries & wholesome daily meals prepared by certified local home chefs.
              </p>

              <div className="flex items-center gap-2.5 pt-1.5">
                <Link href="/subscriptions">
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-3.5 h-8 md:h-9 rounded-xl text-xs shadow-md transition-all cursor-pointer">
                    🍱 {hasActiveSubscription ? 'My Subscription' : 'Explore Tiffin Plans'}
                    <Sparkles className="ml-1 w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Link href="/meals">
                  <Button variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-medium px-3.5 h-8 md:h-9 rounded-xl text-xs cursor-pointer">
                    🍛 Browse All Dishes
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right quick status widget */}
            {hasActiveSubscription ? (
              <div className="hidden lg:flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md shrink-0">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-xl shrink-0">
                  🥗
                </div>
                <div className="text-xs space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-orange-400 font-bold uppercase tracking-wider text-[10px]">Active Tiffin Plan</span>
                  </div>
                  <p className="text-white font-bold truncate max-w-[160px]">{activeVendorName}</p>
                  <Link href="/subscriptions" className="text-gray-300 hover:text-white text-[11px] underline">
                    Manage Schedule →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md shrink-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-xl text-white shadow-sm shrink-0">
                  ⭐
                </div>
                <div className="text-xs space-y-0.5">
                  <p className="text-amber-400 font-bold uppercase tracking-wider text-[10px]">Weekly Tiffin Club</p>
                  <p className="text-white font-bold">From ₹99 / meal</p>
                  <Link href="/subscriptions" className="text-orange-400 hover:text-orange-300 text-[11px] font-semibold underline">
                    Unlock Tiffins →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-5 md:py-6 max-w-7xl relative z-20 space-y-8 pb-32">
        {/* Unified Search Experience & Quick Categories */}
        <CustomerSearch />

        {/* Live Kitchen Circle & Tomorrow's Menu Broadcast Hub - Exclusively for Active Subscribers */}
        {hasActiveSubscription && activeVendorId && (
          <EmbeddedKitchenCircle
            vendorId={activeVendorId}
            vendorName={activeVendorName}
            isActiveSubscriber={true}
          />
        )}

        {/* Curated Recommendations - Directly visible above the fold */}
        <div className="space-y-6">
          <div className="flex items-end justify-between border-b border-gray-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-orange-100 flex items-center justify-center text-[0.65rem] shadow-xs">⭐</div>
                <p className="text-[0.68rem] font-black text-orange-600 uppercase tracking-[0.25em]">Top Rated Selection</p>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-[#1A1A1A] tracking-tight">
                Trending <span className="text-orange-600">Dishes & Kitchens</span>
              </h2>
            </div>
            <Link href="/meals" className="group flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-orange-600 transition-colors pb-1">
              <span>View Full Menu</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          {topMeals && topMeals.length > 0 ? (
            /* Fixed the Grid Issue: Pass the whole list to TopMealsSection */
            <TopMealsSection meals={topMeals as any} />
          ) : (
            <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-100">
               <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-200" />
               <h3 className="text-xl font-black text-gray-900 uppercase">Curating Excellence...</h3>
               <p className="text-xs font-medium text-gray-400 mt-2 max-w-sm mx-auto">Our master chefs are currently establishing their supply lines. Check back shortly.</p>
            </div>
          )}
        </div>

        {/* Highest Rated Kitchens Leaderboard */}
        <HighestRatedVendors />

        {/* Premium Quick Access Hub */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-24">
          {[
            { label: 'Intelligence', sub: 'Real-time Tracking', icon: '🛵', path: '/orders', color: 'bg-orange-50' },
            { label: 'Commitment', sub: 'Active Subscriptions', icon: '📅', path: '/subscriptions', color: 'bg-red-50' },
            { label: 'Identity', sub: 'Account Profile', icon: '🧡', path: '/profile', color: 'bg-purple-50' }
          ].map((item, i) => (
            <Link key={i} href={item.path} className="group relative">
               <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-600 rounded-[3rem] blur opacity-0 group-hover:opacity-10 transition duration-700"></div>
               <Card className="relative border-none bg-white p-10 rounded-[2.5rem] shadow-sm group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all duration-700 overflow-hidden h-full">
                  <div className="flex flex-col gap-8">
                    <div className={`w-24 h-24 ${item.color} rounded-[2rem] flex items-center justify-center text-4xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-inner`}>
                      {item.icon}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-3xl font-black text-[#1A1A1A] tracking-tighter italic uppercase">{item.label}</h3>
                      <p className="text-[0.65rem] font-black text-gray-400 uppercase tracking-[0.2em]">{item.sub}</p>
                    </div>
                  </div>
                  <div className="mt-12 flex items-center justify-between text-[#1A1A1A]">
                     <span className="text-[0.6rem] font-black uppercase tracking-[0.4em] opacity-30 group-hover:opacity-100 transition-opacity">Access Terminal</span>
                     <div className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-[#1A1A1A] group-hover:text-white transition-all duration-500">
                        <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                     </div>
                  </div>
               </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
