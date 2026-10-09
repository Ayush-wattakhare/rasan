'use client';

import { Card } from '@/components/ui/card';
import { Package, Star, Activity, TrendingUp } from 'lucide-react';

interface StatsOverviewProps {
  totalDeliveries: number;
  rating: number;
  isOnline: boolean;
  activeDeliveries: number;
}

export default function StatsOverview({
  totalDeliveries,
  rating,
  isOnline,
  activeDeliveries,
}: StatsOverviewProps) {
  const stats = [
    {
      label: 'Total Deliveries',
      value: totalDeliveries,
      icon: Package,
      color: 'text-blue-600',
    },
    {
      label: 'Rating',
      value: rating.toFixed(1),
      icon: Star,
      color: 'text-yellow-600',
    },
    {
      label: 'Status',
      value: isOnline ? 'Online' : 'Offline',
      icon: Activity,
      color: isOnline ? 'text-green-600' : 'text-gray-600',
    },
    {
      label: 'Active Deliveries',
      value: activeDeliveries,
      icon: TrendingUp,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <Icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
