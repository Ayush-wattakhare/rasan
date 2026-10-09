'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface RevenueChartProps {
  data: Array<{ date: string; revenue: number }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[0.6rem] font-black uppercase tracking-widest text-orange-600">
            Financial Velocity
          </span>
          <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tight">
            Revenue Analytics (30D)
          </h3>
        </div>
      </div>
      <div className="w-full min-w-0 pt-4 h-[280px]">
        {mounted ? (
          <ResponsiveContainer width="100%" height={280} minWidth={0}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EA580C" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#EA580C" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                contentStyle={{ backgroundColor: '#18181b', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#EA580C" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50/50 rounded-2xl animate-pulse">
            <span className="text-xs font-bold text-gray-400">Loading chart data...</span>
          </div>
        )}
      </div>
    </div>
  );
}
