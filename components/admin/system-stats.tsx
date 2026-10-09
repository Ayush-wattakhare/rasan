'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/format';
import { Users, ShoppingBag, Landmark, Repeat, Sparkles, ArrowUpRight, Truck, ChefHat } from 'lucide-react';
import { RASAN_COMMISSION_RATE, VENDOR_PAYOUT_RATE, RASAN_COMMISSION_PERCENTAGE } from '@/lib/utils/constants';

interface SystemStatsProps {
  stats: {
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
    rasanEarnings?: number;
    vendorPayouts?: number;
    activeSubscriptions: number;
  };
}

export default function SystemStats({ stats }: SystemStatsProps) {
  const totalRevenue = stats.totalRevenue || 0;
  const rasanEarnings = stats.rasanEarnings ?? Math.round(totalRevenue * RASAN_COMMISSION_RATE);
  const vendorPayouts = stats.vendorPayouts ?? Math.round(totalRevenue * VENDOR_PAYOUT_RATE);

  return (
    <div className="space-y-4">
      {/* Primary Financial Split Banner */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* 1. RASAN EARNINGS (7% COMMISSION) */}
        <Card className="border-none shadow-xl bg-gradient-to-br from-[#1A1A1A] to-[#2A1810] text-white rounded-[2rem] overflow-hidden relative group hover:scale-[1.01] transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-orange-600/30 transition-all pointer-events-none" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-600/30 border border-orange-500/40 text-orange-400 text-[0.6rem] font-black uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-orange-400 animate-pulse" /> {RASAN_COMMISSION_PERCENTAGE}% PLATFORM CUT
              </div>
              <span className="text-[0.55rem] font-black text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full uppercase">
                Direct Net Yield
              </span>
            </div>

            <div className="mt-4 space-y-1">
              <div className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest">
                RASAN EARNINGS
              </div>
              <div className="text-3xl sm:text-4xl font-black text-orange-500 tracking-tight italic">
                {formatCurrency(rasanEarnings)}
              </div>
              <p className="text-[0.6rem] font-bold text-gray-400 pt-1 flex items-center gap-1.5">
                <span>Collected from {RASAN_COMMISSION_PERCENTAGE}% meal price commission</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 2. VENDOR PAYOUTS (93% CHEF SHARE) */}
        <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden group hover:shadow-2xl transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[0.6rem] font-black uppercase tracking-wider border border-amber-100">
                <ChefHat className="w-3 h-3 text-amber-600" /> {100 - RASAN_COMMISSION_PERCENTAGE}% CHEF SETTLEMENT
              </div>
              <span className="text-[0.55rem] font-bold text-gray-400 uppercase">
                Gross Ingress: {formatCurrency(totalRevenue)}
              </span>
            </div>

            <div className="mt-4 space-y-1">
              <div className="text-[0.65rem] font-black text-gray-500 uppercase tracking-widest">
                HOME CHEF DISBURSEMENTS
              </div>
              <div className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight italic">
                {formatCurrency(vendorPayouts)}
              </div>
              <p className="text-[0.6rem] font-bold text-gray-400 pt-1">
                Direct earnings payable to home kitchen partners
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 3. LOGISTICS DISPATCH RULES */}
        <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden group hover:shadow-2xl transition-all md:col-span-2 lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-[0.6rem] font-black uppercase tracking-wider border border-blue-100">
                <Truck className="w-3 h-3 text-blue-600" /> LOGISTICS PRICING RULE
              </div>
              <span className="text-[0.55rem] font-black text-blue-600 bg-blue-100/50 px-2 py-0.5 rounded-full uppercase">
                Hyperlocal Matrix
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between bg-green-50 p-2.5 rounded-xl border border-green-100">
                <span className="text-xs font-black text-green-900">Under 7 KM</span>
                <span className="text-xs font-black text-green-700 bg-green-200/60 px-2 py-0.5 rounded-lg uppercase">
                  FREE (₹0)
                </span>
              </div>
              <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <span className="text-xs font-black text-gray-800">Above 7 KM</span>
                <span className="text-xs font-black text-gray-700 font-mono">
                  ₹25 Base + ₹10/KM
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Operational Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* User Base */}
        <Card className="border-none shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] bg-white rounded-[2rem] overflow-hidden group hover:shadow-xl transition-all">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-sm group-hover:scale-105 transition-transform shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 flex-1 min-w-0">
              <div className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest truncate">REGISTERED USERS</div>
              <div className="text-xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-[0.5rem] font-bold text-gray-400 truncate opacity-60">Customers & Partners</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="border-none shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] bg-white rounded-[2rem] overflow-hidden group hover:shadow-xl transition-all">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-sm group-hover:scale-105 transition-transform shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 flex-1 min-w-0">
              <div className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest truncate">TOTAL MEAL ORDERS</div>
              <div className="text-xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">{stats.totalOrders.toLocaleString()}</div>
              <p className="text-[0.5rem] font-bold text-gray-400 truncate opacity-60">Delivered & Active Sorties</p>
            </div>
          </CardContent>
        </Card>

        {/* Active Subscriptions */}
        <Card className="border-none shadow-[0_20px_40px_-15px_rgba(0,0,0,0.04)] bg-white rounded-[2rem] overflow-hidden group hover:shadow-xl transition-all">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm group-hover:scale-105 transition-transform shrink-0">
              <Repeat className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 flex-1 min-w-0">
              <div className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest truncate">RECURRING TIFFINS</div>
              <div className="text-xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">{stats.activeSubscriptions.toLocaleString()}</div>
              <p className="text-[0.5rem] font-bold text-gray-400 truncate opacity-60">Active Weekly/Monthly Subscriptions</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
