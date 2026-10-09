import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Star, ChefHat, Award, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default async function HighestRatedVendors() {
  const supabase = await createClient();

  const { data: topVendors } = await supabase
    .from('vendors')
    .select(`
      id,
      business_name,
      cuisine,
      rating,
      total_orders,
      address,
      description
    `)
    .eq('is_active', true)
    .order('rating', { ascending: false })
    .limit(4);

  if (!topVendors || topVendors.length === 0) return null;

  return (
    <section className="space-y-8 pt-8 border-t border-gray-100">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span className="text-[0.65rem] font-black text-amber-600 uppercase tracking-[0.3em] italic">
              Culinary Leaderboard
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] tracking-tighter italic uppercase">
            HIGHEST RATED <span className="text-orange-600">KITCHENS</span>
          </h2>
        </div>
        <Link
          href="/vendors"
          className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-orange-600 transition-colors"
        >
          View All Partner Chefs
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {topVendors.map((vendor) => (
          <Link key={vendor.id} href={`/vendors/${vendor.id}`} className="group">
            <Card className="border-none shadow-md hover:shadow-2xl bg-white rounded-[2rem] overflow-hidden transition-all duration-300 group-hover:-translate-y-1 h-full flex flex-col justify-between">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 font-black">
                    <ChefHat className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-black text-amber-700">
                      {vendor.rating ? vendor.rating.toFixed(1) : '5.0'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black text-gray-900 group-hover:text-orange-600 transition-colors uppercase italic tracking-tight">
                    {vendor.business_name}
                  </h3>
                  <p className="text-xs font-semibold text-gray-500 line-clamp-2">
                    {vendor.description || `${vendor.business_name} - Fresh home cooked meals`}
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap gap-1.5">
                  {(vendor.cuisine || ['Indian']).map((c: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 text-[0.6rem] font-black uppercase text-gray-600 tracking-wider"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </CardContent>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-500">
                <span>{vendor.total_orders || 0}+ Completed Orders</span>
                <span className="text-orange-600 font-black group-hover:translate-x-1 transition-transform">Menu →</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
