'use client';

import Link from 'next/link';
import { Plus, Package, BarChart3, Settings, ShieldAlert, IndianRupee, ArrowRight, Megaphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function QuickActions() {
  const actions = [
    { label: 'Kitchen Circle & Broadcast', sub: "Tomorrow's Menu & Subscriber Chat", icon: Megaphone, path: '/subscriber-broadcast', color: 'bg-amber-600 text-white' },
    { label: 'Add New Dish', sub: 'Menu Management', icon: Plus, path: '/menu-management', color: 'bg-orange-600 text-white' },
    { label: 'Order Ledger', sub: 'All Kitchen Orders', icon: Package, path: '/vendor-orders', color: 'bg-[#1A1A1A] text-white' },
    { label: 'Revenue & Payouts', sub: 'Instant Cashout / UPI', icon: IndianRupee, path: '/payouts', color: 'bg-green-600 text-white' },
    { label: 'Impact & Analytics', sub: 'Growth & Ratings', icon: BarChart3, path: '/analytics', color: 'bg-[#1A1A1A] text-white' },
    { label: 'Kitchen Settings', sub: 'Profile & Operating Hours', icon: Settings, path: '/vendor-profile', color: 'bg-[#1A1A1A] text-white' },
  ];

  return (
    <div className="grid gap-3">
      {actions.map((action, i) => (
        <Card key={i} className="border-none shadow-md hover:shadow-xl transition-all bg-white rounded-2xl overflow-hidden group">
          <Link href={action.path}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                 <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center shadow-md shrink-0`}>
                    <action.icon className="w-5 h-5" />
                 </div>
                 <div>
                    <div className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest">{action.sub}</div>
                    <div className="text-xs sm:text-sm font-black text-gray-900 uppercase italic tracking-tight">{action.label}</div>
                 </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-orange-600 group-hover:bg-orange-50 transition-all shrink-0">
                 <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </CardContent>
          </Link>
        </Card>
      ))}
    </div>
  );
}
