'use client';

import { DollarSign, Package, Star, TrendingUp, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsOverviewProps {
  stats: {
    totalOrders: number;
    totalRevenue: number;
    averageRating: number;
    pendingOrders: number;
  };
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const cards = [
    {
      label: 'NET REVENUE',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      sub: 'Lifetime Orchestration',
      icon: DollarSign,
      color: 'bg-orange-600'
    },
    {
      label: 'UNIT VOLUME',
      value: stats.totalOrders.toString(),
      sub: 'Successful Deliveries',
      icon: Package,
      color: 'bg-[#1A1A1A]'
    },
    {
      label: 'CSAT RATING',
      value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'New',
      sub: 'Community Sentiment',
      icon: Star,
      color: 'bg-orange-600'
    },
    {
      label: 'ACTIVE OPS',
      value: stats.pendingOrders.toString(),
      sub: 'Orders in Pipeline',
      icon: Zap,
      color: 'bg-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <Card key={i} className="border-none shadow-2xl bg-white rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-all">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl ${card.color} flex items-center justify-center text-white shadow-lg shadow-orange-600/20`}>
                 <card.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">{card.label}</div>
                <div className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter uppercase italic truncate" title={card.value}>{card.value}</div>
                <p className="text-[0.6rem] font-bold text-gray-400 capitalize truncate">{card.sub}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
