'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Clock, 
  Package, 
  MapPin, 
  ChefHat, 
  CheckCircle2, 
  Loader2, 
  ChevronRight,
  Sparkles,
  ShoppingBag,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Order } from '@/lib/supabase/types';
import { format } from 'date-fns';

interface RecentOrdersProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: Order['status']) => void | Promise<void>;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  preparing: 'bg-orange-100 text-orange-800 border-orange-200',
  ready: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  ready_for_pickup: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  picked_up: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  out_for_delivery: 'bg-purple-100 text-purple-800 border-purple-200',
  delivered: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Cooking',
  ready: 'Ready',
  ready_for_pickup: 'Ready',
  picked_up: 'Picked Up',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function RecentOrders({ orders, onUpdateStatus }: RecentOrdersProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const getNextStatus = (status: Order['status']): { status: Order['status']; label: string } | null => {
    switch (status) {
      case 'pending':
        return { status: 'confirmed', label: 'Accept' };
      case 'confirmed':
        return { status: 'preparing', label: 'Start Cooking' };
      case 'preparing':
        return { status: 'ready', label: 'Mark Ready' };
      default:
        return null;
    }
  };

  const handleAction = async (orderId: string, nextStatus: Order['status']) => {
    setActionLoadingId(orderId);
    try {
      await onUpdateStatus(orderId, nextStatus);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === 'active') {
      return ['pending', 'confirmed', 'preparing', 'ready', 'ready_for_pickup', 'out_for_delivery'].includes(o.status);
    }
    if (filter === 'completed') {
      return o.status === 'delivered' || o.status === 'cancelled';
    }
    return true;
  });

  const activeCount = orders.filter((o) => 
    ['pending', 'confirmed', 'preparing', 'ready', 'ready_for_pickup'].includes(o.status)
  ).length;

  return (
    <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
      {/* Header with Title, Tabs, and View All link */}
      <CardHeader className="p-6 pb-4 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 font-black">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-black text-gray-900 uppercase italic tracking-tight">
                  Recent Kitchen Orders
                </CardTitle>
                {activeCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[0.6rem] font-black uppercase tracking-wider animate-pulse">
                    {activeCount} Active
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-semibold">
                Compact live orders stream • Quick action controls
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Pills */}
            <div className="flex items-center bg-gray-100/80 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg transition-all text-[0.65rem] font-black uppercase tracking-wider ${
                  filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                All ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('active')}
                className={`px-3 py-1 rounded-lg transition-all text-[0.65rem] font-black uppercase tracking-wider ${
                  filter === 'active' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('completed')}
                className={`px-3 py-1 rounded-lg transition-all text-[0.65rem] font-black uppercase tracking-wider ${
                  filter === 'completed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Done
              </button>
            </div>

            <Button asChild variant="ghost" size="sm" className="text-xs font-black uppercase tracking-wider text-orange-600 hover:bg-orange-50 rounded-xl">
              <Link href="/vendor-orders">
                View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Package className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">
              No {filter !== 'all' ? filter : ''} orders found
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
            {filteredOrders.map((order) => {
              const nextAction = getNextStatus(order.status);
              const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
              const orderTime = new Date(order.created_at);
              const isUpdating = actionLoadingId === order.id;

              const itemsSummary = order.items
                .map((i) => `${i.quantity}× ${i.name}`)
                .join(', ');

              const subItem = order.items.find((i: any) => i.subscription_type === 'weekly' || i.subscription_type === 'monthly') as any;
              const isSub = !!subItem;

              return (
                <div
                  key={order.id}
                  className="p-4 sm:p-5 hover:bg-orange-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  {/* Left: Order Info & Items */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
                        #{order.order_number || order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="text-[0.65rem] font-bold text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {format(orderTime, 'p')}
                      </span>
                      {isSub && (
                        <span className="bg-amber-100 text-amber-800 text-[0.6rem] font-black uppercase px-2 py-0.5 rounded-full border border-amber-200">
                          🍱 {subItem.subscription_type} Plan ({subItem.delivery_days?.length || 5}d/wk)
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-[0.6rem] font-black uppercase px-2 py-0.5 rounded-full border ${
                          statusColors[order.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </div>

                    {/* Meal Items Summary */}
                    <p className="text-xs font-bold text-gray-800 truncate" title={itemsSummary}>
                      {itemsSummary}
                    </p>

                    {/* Delivery Destination */}
                    <div className="flex items-center gap-3 text-[0.65rem] text-gray-400 font-medium">
                      <span className="flex items-center gap-1 truncate max-w-[200px]">
                        <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                        {typeof order.delivery_address === 'string'
                          ? order.delivery_address
                          : order.delivery_address?.street || 'Local Delivery'}
                      </span>
                      <span>•</span>
                      <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                      {isSub && (
                        <>
                          <span>•</span>
                          <span className="text-amber-700 font-bold">Slot: {subItem.delivery_time || '12:30 PM'}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Price & Quick Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <div className="text-left sm:text-right">
                      <div className="text-xs font-black text-gray-400 uppercase tracking-widest text-[0.55rem]">
                        {isSub ? 'Subscription Total' : 'Total Value'}
                      </div>
                      <div className="text-base font-black text-gray-900">
                        ₹{order.total.toFixed(0)}
                      </div>
                    </div>

                    {isSub ? (
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="h-9 px-3 border-amber-200 text-amber-800 bg-amber-50/60 font-bold text-xs rounded-xl hover:bg-amber-100"
                      >
                        <Link href="/subscriber-broadcast">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-amber-600" />
                          <span>Scheduled</span>
                        </Link>
                      </Button>
                    ) : nextAction ? (
                      <Button
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => handleAction(order.id, nextAction.status)}
                        className="h-9 px-4 bg-[#1A1A1A] hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" /> Updating
                          </>
                        ) : (
                          <>
                            {nextAction.label} <ChevronRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="h-9 px-3 border-gray-200 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-50"
                      >
                        <Link href="/vendor-orders">
                          Details
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Card Footer with Quick Link */}
      <div className="p-3.5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-semibold px-6">
        <span>Showing latest {filteredOrders.length} orders</span>
        <Link
          href="/vendor-orders"
          className="text-orange-600 font-black uppercase text-[0.65rem] tracking-wider hover:underline flex items-center gap-1"
        >
          Open Full Order Ledger →
        </Link>
      </div>
    </Card>
  );
}
