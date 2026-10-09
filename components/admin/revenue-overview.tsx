'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils/format';
import { Landmark, Sparkles, ChefHat, Truck, ArrowUpRight } from 'lucide-react';
import { RASAN_COMMISSION_RATE, VENDOR_PAYOUT_RATE, RASAN_COMMISSION_PERCENTAGE } from '@/lib/utils/constants';

interface RevenueData {
  date: string;
  revenue: number;
}

export default function RevenueOverview() {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRevenue() {
      const supabase = createClient();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: orders } = await supabase
        .from('orders')
        .select('created_at, total')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (orders && orders.length > 0) {
        const revenueByDate = orders.reduce((acc, order) => {
          const date = new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          acc[date] = (acc[date] || 0) + (order.total || 0);
          return acc;
        }, {} as Record<string, number>);

        const chartData = Object.entries(revenueByDate).map(([date, revenue]) => ({
          date,
          revenue,
        }));

        setData(chartData);
      } else {
        // Sample baseline
        setData([
          { date: 'Today', revenue: 4200 },
          { date: 'Yesterday', revenue: 6800 },
          { date: '28 Aug', revenue: 5400 },
          { date: '27 Aug', revenue: 8100 },
        ]);
      }
      setLoading(false);
    }

    fetchRevenue();
  }, []);

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const rasanEarnings = Math.round(totalRevenue * RASAN_COMMISSION_RATE);
  const vendorShare = Math.round(totalRevenue * VENDOR_PAYOUT_RATE);

  return (
    <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-6 sm:p-8 bg-[#1A1A1A] text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-orange-400 text-[0.6rem] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> Financial Distribution Ledger
            </div>
            <CardTitle className="text-xl sm:text-2xl font-black uppercase italic tracking-tight text-white">
              Revenue & <span className="text-orange-500">Commission Overview</span>
            </CardTitle>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest block">
              Gross Merchandise Value
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white italic">
              {formatCurrency(totalRevenue)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8 space-y-6">
        {/* Commission Split Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-100 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[0.6rem] font-black uppercase tracking-wider text-orange-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-600" /> RASAN EARNINGS ({RASAN_COMMISSION_PERCENTAGE}%)
              </span>
              <span className="text-[0.55rem] font-black text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                Platform Cut
              </span>
            </div>
            <div className="text-2xl font-black text-orange-600 italic">
              {formatCurrency(rasanEarnings)}
            </div>
            <p className="text-[0.6rem] text-gray-500 font-medium">Net {RASAN_COMMISSION_PERCENTAGE}% collected across all meal sales</p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[0.6rem] font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5 text-gray-600" /> VENDOR SHARE ({100 - RASAN_COMMISSION_PERCENTAGE}%)
              </span>
              <span className="text-[0.55rem] font-bold text-gray-400">Direct Chef Payout</span>
            </div>
            <div className="text-2xl font-black text-gray-900 italic">
              {formatCurrency(vendorShare)}
            </div>
            <p className="text-[0.6rem] text-gray-500 font-medium">{100 - RASAN_COMMISSION_PERCENTAGE}% disbursed to verified home kitchens</p>
          </div>
        </div>

        {/* Recent Daily Trajectory */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
            Recent Daily Ingress Trajectory
          </h4>
          <div className="divide-y divide-gray-100">
            {data.slice(-5).map((item) => {
              const dayEarnings = Math.round(item.revenue * RASAN_COMMISSION_RATE);
              return (
                <div key={item.date} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-gray-800">{item.date}</span>
                    <span className="text-[0.6rem] text-gray-400 block font-mono">
                      Gross: {formatCurrency(item.revenue)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-orange-600 font-mono">
                      +{formatCurrency(dayEarnings)}
                    </span>
                    <span className="text-[0.55rem] text-gray-400 block uppercase font-bold">Rasan {RASAN_COMMISSION_PERCENTAGE}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
