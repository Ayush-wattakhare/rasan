'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface OrdersChartProps {
  data: Array<{ date: string; orders: number }>;
}

export function OrdersChart({ data }: OrdersChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[0.6rem] font-black uppercase tracking-widest text-orange-600">
            Fulfillment Volume
          </span>
          <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tight">
            Daily Order Volume
          </h3>
        </div>
      </div>
      <div className="w-full min-w-0 pt-4 h-[280px]">
        {mounted ? (
          <ResponsiveContainer width="100%" height={280} minWidth={0}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                formatter={(value: any) => [`${value} Orders`, 'Volume']}
                contentStyle={{ backgroundColor: '#18181b', borderRadius: '1rem', border: 'none', color: '#fff', fontSize: '12px' }}
              />
              <Bar dataKey="orders" fill="#EA580C" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50/50 rounded-2xl animate-pulse">
            <span className="text-xs font-bold text-gray-400">Loading order metrics...</span>
          </div>
        )}
      </div>
    </div>
  );
}
