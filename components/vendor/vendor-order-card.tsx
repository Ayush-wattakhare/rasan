'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Clock, MapPin, User, ChevronRight, Hash, Package, Loader2, CheckCircle2, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Order } from '@/lib/supabase/types';

interface VendorOrderCardProps {
  order: Order;
  onUpdateStatus: (orderId: string, status: Order['status']) => void | Promise<void>;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500 text-white',
  confirmed: 'bg-blue-500 text-white',
  preparing: 'bg-orange-600 text-white',
  ready: 'bg-green-600 text-white',
  ready_for_pickup: 'bg-emerald-600 text-white',
  picked_up: 'bg-indigo-600 text-white',
  out_for_delivery: 'bg-purple-600 text-white',
  delivered: 'bg-gray-900 text-white',
  cancelled: 'bg-red-600 text-white',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  ready_for_pickup: 'Ready for Pickup',
  picked_up: 'Picked Up',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function VendorOrderCard({
  order,
  onUpdateStatus,
}: VendorOrderCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const orderDate = new Date(order.created_at);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const subItem = order.items.find(
    (item: any) => item.subscription_type === 'weekly' || item.subscription_type === 'monthly'
  ) as any;
  const isSubscription = !!subItem;

  const getNextStatus = (): { status: Order['status']; label: string } | null => {
    switch (order.status) {
      case 'pending':
        return { status: 'confirmed', label: 'Confirm Order' };
      case 'confirmed':
        return { status: 'preparing', label: 'Start Cooking' };
      case 'preparing':
        return { status: 'ready', label: 'Mark as Ready for Pickup' };
      default:
        return null;
    }
  };

  const nextAction = getNextStatus();

  const handleAction = async () => {
    if (!nextAction || isUpdating) return;
    setIsUpdating(true);
    try {
      await onUpdateStatus(order.id, nextAction.status);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-none shadow-sm hover:shadow-xl transition-all bg-white rounded-[2rem] overflow-hidden group">
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${isSubscription ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'} flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors`}>
              {isSubscription ? <Calendar className="w-6 h-6" /> : <Hash className="w-6 h-6" />}
            </div>
            <div>
              <div className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                {isSubscription ? 'Scheduled Subscription Order' : 'Order Ingestion'}
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter">
                #{order.order_number}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSubscription && (
              <Badge className="bg-amber-50 text-amber-800 border border-amber-200 h-8 px-4 rounded-full font-black uppercase tracking-widest text-[0.6rem] shadow-xs">
                🍱 {subItem.subscription_type?.toUpperCase()} PLAN ({subItem.subscription_type === 'weekly' ? '20% OFF' : '30% OFF'})
              </Badge>
            )}
            <Badge
              className={`${
                statusColors[order.status] || 'bg-gray-500 text-white'
              } h-8 px-4 rounded-full font-black uppercase tracking-widest text-[0.6rem] border-none shadow-lg`}
            >
              {statusLabels[order.status] || order.status}
            </Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest">
                  Customer Protocol
                </div>
                <div className="text-sm font-bold text-gray-900">
                  ID: {order.customer_id.slice(0, 8)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest">
                  Drop Zone
                </div>
                <div className="text-sm font-bold text-gray-900 line-clamp-1">
                  {order.delivery_address.street}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl ${isSubscription ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'} flex items-center justify-center`}>
                {isSubscription ? <Calendar className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest">
                  {isSubscription ? 'Delivery Schedule' : 'Time Registered'}
                </div>
                <div className="text-sm font-bold text-gray-900">
                  {isSubscription
                    ? `${subItem.delivery_days?.length || 5} Days/Wk • ${subItem.delivery_time || '12:30 PM'}`
                    : format(orderDate, 'p')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[0.55rem] font-black text-gray-400 uppercase tracking-widest">
                  Content Volume
                </div>
                <div className="text-sm font-bold text-gray-900">
                  {isSubscription ? `${subItem.subscription_type?.toUpperCase()} Meal Plan` : `${itemCount} Units Organized`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Manifest Entries */}
        <div className="bg-gray-50/50 rounded-2xl p-6 mb-8 border border-gray-100">
          <div className="text-[0.6rem] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
            ITEM MANIFEST
          </div>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="font-bold text-gray-800">
                  {item.quantity}×{' '}
                  <span className="uppercase italic tracking-tighter ml-1">{item.name}</span>
                </span>
                <span className="font-black text-gray-400">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-gray-100">
          <div>
            <div className="text-[0.6rem] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
              TOTAL VALUATION
            </div>
            <p className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">
              ₹{order.total.toLocaleString()}
            </p>
          </div>

          {isSubscription ? (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Scheduled @ {subItem.delivery_time || '12:30 PM'}</span>
              </div>
              <Button
                asChild
                size="lg"
                className="bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-widest px-6 h-14 rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer text-xs"
              >
                <Link href="/subscriber-broadcast">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>Kitchen Circle & Broadcast</span>
                </Link>
              </Button>
            </div>
          ) : nextAction ? (
            <Button
              size="lg"
              disabled={isUpdating}
              className="bg-[#1A1A1A] hover:bg-orange-600 text-white font-black uppercase tracking-widest px-8 h-14 rounded-xl shadow-lg transition-all group/btn flex items-center gap-2 cursor-pointer"
              onClick={handleAction}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                </>
              ) : (
                <>
                  {nextAction.label}
                  <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl">
              <CheckCircle2 className="w-4 h-4" /> Ready for Pickup / Delivery
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
