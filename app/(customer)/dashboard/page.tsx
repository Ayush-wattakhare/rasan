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

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Premium Dashboard Header */}
      <div className="relative overflow-hidden bg-[#1A1A1A] py-16 md:py-24 lg:py-32">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-red-500/5 rounded-full blur-[80px] -ml-32 -mb-32"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl space-y-8">
             <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <span className="text-xl">👋</span>
                <span className="text-[0.7rem] font-black text-white uppercase tracking-[0.3em] italic">
                  Systems Online: {profile?.email?.split('@')[0] || 'Gourmet'}
                </span>
             </div>

             <div className="space-y-4">
               <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.85] uppercase italic">
                 REDEFINE <br />
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600">
                   DAILY TASTE
                 </span>
               </h1>
               <p className="text-xl text-gray-400 max-w-2xl font-medium leading-relaxed">
                 High-performance home cooking delivered with hyperlocal precision.
               </p>
             </div>

             <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/subscriptions">
                    <Button size="lg" className="bg-orange-600 hover:bg-[#FDFCFB] hover:text-[#1A1A1A] text-white font-black uppercase tracking-[0.2em] px-10 h-16 rounded-2xl shadow-2xl transition-all duration-500 border-none group">
                        Unlock Premium Plans
                        <Sparkles className="ml-2 w-5 h-5 group-hover:rotate-45 transition-transform" />
                    </Button>
                </Link>
                <Link href="/meals">
                    <Button variant="outline" size="lg" className="bg-transparent border-white/20 text-white hover:bg-white/5 font-black uppercase tracking-[0.2em] px-10 h-16 rounded-2xl transition-all duration-500">
                        Explore Recipes
                    </Button>
                </Link>
             </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl -mt-12 relative z-20 space-y-12">
        {/* Unified Search Experience */}
        <CustomerSearch />

        {/* Live Kitchen Circle & Tomorrow's Menu Broadcast Hub - Exclusively for Active Subscribers */}
        {hasActiveSubscription && activeVendorId && (
          <EmbeddedKitchenCircle
            vendorId={activeVendorId}
            vendorName={activeVendorName}
            isActiveSubscriber={true}
          />
        )}

        {/* Curated Recommendations */}
        <div className="space-y-12">
          <div className="flex items-end justify-between border-b-2 border-gray-50 pb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                 <div className="w-6 h-6 rounded-md bg-orange-100 flex items-center justify-center text-[0.6rem] shadow-sm">⭐</div>
                 <p className="text-[0.7rem] font-black text-orange-600 uppercase tracking-[0.4em] italic">Top Tier Selection</p>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] tracking-tighter italic leading-none uppercase">
                Trending <span className="text-gray-200">/ Kitchens</span>
              </h2>
            </div>
            <Link href="/meals" className="group flex items-center gap-3 text-[0.65rem] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-orange-600 transition-all pb-2">
              Explore Universal Menu
              <span className="group-hover:translate-x-2 transition-transform">→</span>
            </Link>
          </div>

          {topMeals && topMeals.length > 0 ? (
            /* Fixed the Grid Issue: Pass the whole list to TopMealsSection */
            <TopMealsSection meals={topMeals as any} />
          ) : (
            <div className="bg-white rounded-[3rem] p-32 text-center border-2 border-dashed border-gray-100">
               <ShoppingBag className="w-20 h-20 mx-auto mb-6 text-gray-100" />
               <h3 className="text-2xl font-black text-gray-900 uppercase italic">Curating Excellence...</h3>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-4 max-w-sm mx-auto leading-relaxed">Our master chefs are currently establishing their supply lines. Check back in a few minutes.</p>
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
