'use client';

import Link from 'next/link';
import { LifeBuoy, Radio, IndianRupee, Bell, ArrowUpRight } from 'lucide-react';

export default function AdminCommandActions() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* 1. Dispute Hub */}
      <Link
        href="/support-management"
        className="h-24 rounded-2xl flex flex-col justify-between p-4 bg-[#1A1A1A] hover:bg-[#252525] border border-gray-800 shadow-lg group transition-all text-left relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <LifeBuoy className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-all" />
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-all" />
        </div>
        <div>
          <span className="text-xs font-black uppercase italic tracking-tight text-white block">
            Dispute Hub
          </span>
          <span className="text-[0.55rem] text-orange-400 font-bold uppercase tracking-wider block">
            Refunds & Claims
          </span>
        </div>
      </Link>

      {/* 2. Live Ops */}
      <Link
        href="/live-ops"
        className="h-24 rounded-2xl flex flex-col justify-between p-4 bg-[#1A1A1A] hover:bg-[#252525] border border-gray-800 shadow-lg group transition-all text-left relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Radio className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-all animate-pulse" />
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-all" />
        </div>
        <div>
          <span className="text-xs font-black uppercase italic tracking-tight text-white block">
            Live Ops
          </span>
          <span className="text-[0.55rem] text-blue-400 font-bold uppercase tracking-wider block">
            Mission Radar
          </span>
        </div>
      </Link>

      {/* 3. Financial Settlements */}
      <Link
        href="/refunds-ledger"
        className="h-24 rounded-2xl flex flex-col justify-between p-4 bg-[#1A1A1A] hover:bg-[#252525] border border-gray-800 shadow-lg group transition-all text-left relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center">
            <IndianRupee className="w-4 h-4 text-green-400 group-hover:scale-110 transition-all" />
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-all" />
        </div>
        <div>
          <span className="text-xs font-black uppercase italic tracking-tight text-white block">
            Settlements
          </span>
          <span className="text-[0.55rem] text-green-400 font-bold uppercase tracking-wider block">
            Financial Ledger
          </span>
        </div>
      </Link>

      {/* 4. Broadcasts */}
      <Link
        href="/broadcasts"
        className="h-24 rounded-2xl flex flex-col justify-between p-4 bg-[#1A1A1A] hover:bg-[#252525] border border-gray-800 shadow-lg group transition-all text-left relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Bell className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-all" />
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-all" />
        </div>
        <div>
          <span className="text-xs font-black uppercase italic tracking-tight text-white block">
            Broadcasts
          </span>
          <span className="text-[0.55rem] text-purple-400 font-bold uppercase tracking-wider block">
            System Alerts
          </span>
        </div>
      </Link>
    </div>
  );
}
