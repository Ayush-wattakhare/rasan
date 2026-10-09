'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Clock, MapPin, Package, ArrowRight, XCircle, Calendar, KeyRound } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CancelOrderModal } from './cancel-order-modal';
import type { Order } from '@/lib/supabase/types';
import { getDeliveryOtp } from '@/lib/utils/delivery-otp';

interface OrderCardProps {
  order: Order;
  onOrderUpdated?: () => void;
  onTrackOrder?: (order: Order) => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready: 'bg-indigo-100 text-indigo-800',
  ready_for_pickup: 'bg-indigo-100 text-indigo-800',
  picked_up: 'bg-cyan-100 text-cyan-800',
  out_for_delivery: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  ready_for_pickup: 'Ready for Pickup',
  picked_up: 'Picked Up',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export function OrderCard({ order, onOrderUpdated, onTrackOrder }: OrderCardProps) {
  const router = useRouter();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const orderDate = new Date(order.created_at);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const subItem = order.items.find(
    (item: any) => item.subscription_type === 'weekly' || item.subscription_type === 'monthly'
  ) as any;
  const isSubscription = !!subItem;

  useEffect(() => {
    setCurrentStatus(order.status);
  }, [order.status]);

  const canCancel = ['pending', 'confirmed'].includes(currentStatus);

  const handleCancelSuccess = () => {
    setCurrentStatus('cancelled');
    if (onOrderUpdated) {
      onOrderUpdated();
    }
  };

  return (
    <>
      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        orderId={order.id}
        orderNumber={order.order_number}
        totalAmount={order.total}
        currentStatus={currentStatus}
        onSuccess={handleCancelSuccess}
      />

      <div
        onClick={() => router.push(`/orders/${order.id}`)}
        className="block group cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            router.push(`/orders/${order.id}`);
          }
        }}
      >
        <Card className="border-none shadow-sm group-hover:shadow-2xl smooth-transition bg-white overflow-hidden rounded-[2rem]">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{isSubscription ? '🍱' : '📦'}</span>
                  <h3 className="text-xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                    {isSubscription
                      ? `${subItem.subscription_type === 'weekly' ? 'Weekly' : 'Monthly'} Subscription `
                      : 'Order '}
                    <span className="text-gray-300">#{order.order_number}</span>
                  </h3>
                </div>
                <div className="pl-9 space-y-1">
                  <p className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest">
                    Placed on {format(orderDate, 'MMM dd, yyyy · hh:mm a')}
                  </p>
                  {isSubscription && (
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="bg-orange-50 text-orange-700 border border-orange-200 text-[0.6rem] font-black uppercase px-2.5 py-0.5 rounded-full">
                        {subItem.subscription_type === 'weekly' ? 'Weekly Plan • 20% OFF' : 'Monthly Plan • 30% OFF'}
                      </span>
                      <span className="text-[0.65rem] font-bold text-gray-500">
                        {subItem.delivery_days?.length || 5} Days / Week • {subItem.delivery_time || '12:30 PM'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {['preparing', 'ready', 'ready_for_pickup', 'picked_up', 'out_for_delivery'].includes(currentStatus) && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 font-mono font-black text-xs shadow-sm">
                    <KeyRound className="w-3.5 h-3.5 text-orange-600" />
                    <span>PIN: {getDeliveryOtp(order)}</span>
                  </div>
                )}
                <Badge
                  className={`px-4 py-2 rounded-xl text-[0.65rem] font-black uppercase tracking-[0.2em] shadow-sm border ${statusColors[currentStatus] || statusColors.cancelled}`}
                >
                  {statusLabels[currentStatus] || 'Cancelled'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pl-9">
              <div className="space-y-4">
                <div className="flex items-center gap-3 group/item">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover/item:bg-orange-50 transition-colors">
                    <Package className="h-4 w-4 text-gray-400 group-hover/item:text-orange-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[0.6rem] font-black text-gray-300 uppercase tracking-widest">Order Summary</span>
                    <span className="text-sm font-bold text-[#1A1A1A]">
                      {itemCount} {itemCount === 1 ? 'item' : 'items'} ({order.items.map((i) => i.name).join(', ')})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 group/item">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover/item:bg-orange-50 transition-colors">
                    <MapPin className="h-4 w-4 text-gray-400 group-hover/item:text-orange-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[0.6rem] font-black text-gray-300 uppercase tracking-widest">Delivery Address</span>
                    <span className="text-sm font-bold text-[#1A1A1A] line-clamp-1">
                      {order.delivery_address.street}, {order.delivery_address.city}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center items-start md:items-end">
                {isSubscription ? (
                  <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 flex items-center gap-3 w-full md:w-auto">
                    <Calendar className="h-5 w-5 text-amber-700 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[0.6rem] font-black text-amber-900 uppercase tracking-widest">Scheduled Tiffin</span>
                      <span className="text-xs font-black text-amber-950">
                        Delivery @ {subItem.delivery_time || '12:30 PM'} • Next: Tomorrow
                      </span>
                    </div>
                  </div>
                ) : (
                  order.estimated_delivery_time && order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 flex items-center gap-3 w-full md:w-auto">
                      <Clock className="h-5 w-5 text-orange-600 animate-pulse" />
                      <div className="flex flex-col">
                        <span className="text-[0.6rem] font-black text-orange-600 uppercase tracking-widest">Est. Kitchen Arrival</span>
                        <span className="text-sm font-black text-orange-900">{format(new Date(order.estimated_delivery_time), 'p')}</span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-8 border-t border-gray-50 pl-9">
              <div className="flex flex-col">
                <span className="text-[0.6rem] font-black text-gray-300 uppercase tracking-widest mb-1">
                  {isSubscription ? 'Subscription Total' : 'Total Impact Amount'}
                </span>
                <span className="text-3xl font-black text-[#1A1A1A] tracking-tighter italic">{formatCurrency(order.total)}</span>
              </div>
              <div className="flex items-center gap-3">
                {isSubscription ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push('/subscriptions');
                    }}
                    className="h-12 px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-[0.65rem] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-1.5 shadow-md shadow-orange-600/20 cursor-pointer"
                  >
                    <span>Manage Off-Days & Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  canCancel && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowCancelModal(true);
                      }}
                      className="h-12 px-5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-[0.65rem] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel Order
                    </button>
                  )
                )}

                {order.status === 'delivered' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      order.items.forEach((item) => {
                        try {
                          const cartItem = {
                            id: item.meal_id,
                            meal_id: item.meal_id,
                            vendor_id: order.vendor_id,
                            name: item.name,
                            price: item.price,
                            quantity: item.quantity,
                            subscription_type: (item as any).subscription_type || 'one_time',
                            delivery_days: (item as any).delivery_days || [],
                            delivery_time: (item as any).delivery_time || 'lunch',
                            discount_percentage: (item as any).discount_percentage || 0,
                            created_at: new Date().toISOString(),
                          };
                          const existingCart = JSON.parse(localStorage.getItem('rasan_cart') || '{"items":[]}');
                          existingCart.items.push(cartItem);
                          localStorage.setItem('rasan_cart', JSON.stringify(existingCart));
                        } catch (err) {
                          console.error('Re-order error:', err);
                        }
                      });
                      window.location.href = '/checkout';
                    }}
                    className="h-12 px-6 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-[0.65rem] font-black uppercase tracking-[0.2em] transition-all shadow-xl flex items-center gap-2 cursor-pointer"
                  >
                    Re-Order 🍱
                  </button>
                )}
                {onTrackOrder && order.status !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onTrackOrder(order);
                    }}
                    className="h-12 px-5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-100 text-[0.65rem] font-black uppercase tracking-[0.15em] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    Quick Track 🛵
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/orders/${order.id}`);
                  }}
                  className="h-12 px-6 rounded-xl bg-[#1A1A1A] hover:bg-orange-600 text-white text-[0.65rem] font-black uppercase tracking-[0.2em] transition-all shadow-xl group/btn flex items-center gap-2 cursor-pointer"
                >
                  Live Track Details <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
