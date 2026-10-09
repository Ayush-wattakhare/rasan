'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { VendorOrderCard } from './vendor-order-card';
import { useToast } from '@/lib/hooks/use-toast';
import { Loader2, Package, Flame, Calendar, Megaphone, ArrowRight, Sparkles } from 'lucide-react';
import type { Order } from '@/lib/supabase/types';

import { AudioOrderAlert } from './audio-order-alert';

interface VendorOrdersListProps {
  initialOrders: Order[];
}

export function VendorOrdersList({ initialOrders }: VendorOrdersListProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const subscriptionOrders = orders.filter((o) =>
    o.items.some(
      (item: any) => item.subscription_type === 'weekly' || item.subscription_type === 'monthly'
    )
  );

  const instantOrders = orders.filter(
    (o) =>
      !o.items.some(
        (item: any) => item.subscription_type === 'weekly' || item.subscription_type === 'monthly'
      )
  );

  const [activeTab, setActiveTab] = useState<'instant' | 'subscriptions'>('instant');

  const pendingInstantCount = instantOrders.filter((o) => o.status === 'pending').length;

  const handleUpdateStatus = async (orderId: string, status: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/vendor/update-order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update order status');
      }

      toast({
        title: 'Status Updated',
        description: `Order status changed to ${status.replace('_', ' ')}`,
      });

      // Refresh the page data
      router.refresh();

      // Update local state
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: status as any } : o))
      );
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const displayedOrders = activeTab === 'instant' ? instantOrders : subscriptionOrders;

  return (
    <div className="space-y-8 relative">
      <AudioOrderAlert pendingCount={pendingInstantCount} onRefresh={() => router.refresh()} />

      {/* Tab Switcher: Instant Orders vs. Scheduled Subscriptions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-2.5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 p-1 bg-gray-100/80 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('instant')}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'instant'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Flame className={`w-4 h-4 ${activeTab === 'instant' ? 'text-orange-600' : 'text-gray-400'}`} />
            <span>Instant Orders (Cook Now)</span>
            {pendingInstantCount > 0 && (
              <span className="bg-orange-600 text-white text-[0.65rem] px-2 py-0.5 rounded-full font-bold animate-pulse">
                {pendingInstantCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('subscriptions')}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'subscriptions'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Calendar className={`w-4 h-4 ${activeTab === 'subscriptions' ? 'text-amber-600' : 'text-gray-400'}`} />
            <span>Scheduled Subscriptions</span>
            {subscriptionOrders.length > 0 && (
              <span className="bg-amber-600 text-white text-[0.65rem] px-2 py-0.5 rounded-full font-bold">
                {subscriptionOrders.length}
              </span>
            )}
          </button>
        </div>

        {/* Quick link to Circles / Broadcast */}
        <Link
          href="/subscriber-broadcast"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/60 rounded-xl transition-all cursor-pointer"
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Broadcast Menu & Chat</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Subscription Guidance Banner */}
      {activeTab === 'subscriptions' && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 border border-amber-200/80 rounded-3xl p-6 sm:p-8 space-y-3">
          <div className="flex items-center gap-2 text-amber-800 font-black text-xs uppercase tracking-widest">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Scheduled Tiffin Kitchen Protocol</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed max-w-3xl">
            Subscribers have paid upfront for recurring meal plans. Meals are prepared <strong>only on their chosen delivery days</strong> and dispatched during their preferred delivery slot (<strong>Lunch: 12:00–1:30 PM</strong> or <strong>Dinner: 7:30–9:00 PM</strong>). Subscribers can pause meals for off-days anytime without penalty.
          </p>
        </div>
      )}

      {isUpdating && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-50 flex items-center justify-center rounded-[3rem]">
          <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
        </div>
      )}

      {displayedOrders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 space-y-4">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-2xl">
            {activeTab === 'instant' ? '🔥' : '🍱'}
          </div>
          <h3 className="text-xl font-black text-[#1A1A1A] uppercase italic tracking-tighter">
            {activeTab === 'instant' ? 'No Instant Orders Right Now' : 'No Scheduled Subscriptions Yet'}
          </h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest max-w-sm mx-auto">
            {activeTab === 'instant'
              ? 'New on-demand orders requiring immediate 25–35 min preparation will appear here.'
              : 'When customers activate weekly or monthly meal plans, they will be listed here with their schedule.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {displayedOrders.map((order) => (
            <VendorOrderCard
              key={order.id}
              order={order}
              onUpdateStatus={handleUpdateStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
