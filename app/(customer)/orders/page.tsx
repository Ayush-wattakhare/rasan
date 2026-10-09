'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Package, Truck, CheckCircle2, Clock, ChefHat, Star, X, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderList } from '@/components/orders/order-list';
import { OrderFilters } from '@/components/orders/order-filters';
import { useAuth } from '@/lib/hooks/use-auth';
import { orderService } from '@/lib/services/order-service';
import type { Order } from '@/lib/supabase/types';
import type { OrderStatus } from '@/types';
import { getDeliveryOtp } from '@/lib/utils/delivery-otp';

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Package },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'preparing', label: 'Preparing', icon: ChefHat },
  { key: 'ready_for_pickup', label: 'Ready', icon: Package },
  { key: 'picked_up', label: 'Picked Up', icon: Truck },
  { key: 'out_for_delivery', label: 'On the way', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

function OrderTracker({ order, onClose, onReview }: { order: Order; onClose: () => void; onReview: (orderId: string) => void }) {
  const normalizedStatus = order.status === 'ready' ? 'ready_for_pickup' : order.status;
  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === normalizedStatus);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto my-auto">
        <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
          <X className="w-4 h-4" />
        </button>
        <div>
          <p className="text-[0.6rem] font-black text-orange-500 uppercase tracking-widest">Live Tracking</p>
          <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter mt-1">Order #{order.id.slice(0, 8).toUpperCase()}</h2>
          <p className="text-xs text-gray-400 font-medium mt-0.5">₹{order.total} • {new Date(order.created_at).toLocaleDateString()}</p>
        </div>

        {/* Handover Security PIN */}
        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white rounded-3xl p-5 shadow-lg flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-orange-200" />
                <span className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-orange-100">
                  Handover Security PIN
                </span>
              </div>
              <p className="text-xs font-bold text-white">Share with rider at doorstep</p>
            </div>
            <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl px-4 py-2 text-center shrink-0">
              <p className="text-[0.5rem] font-black uppercase tracking-widest text-orange-100">OTP</p>
              <p className="text-2xl font-black tracking-widest font-mono text-white leading-tight">{getDeliveryOtp(order)}</p>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-0">
          {STATUS_STEPS.filter((s) => s.key !== 'cancelled').map((step, i) => {
            const done = i <= currentIndex;
            const active = i === currentIndex;
            const Icon = step.icon;
            const isLast = i === STATUS_STEPS.length - 1;
            return (
              <div key={step.key} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    active ? 'bg-orange-600 text-white ring-4 ring-orange-100 scale-110' :
                    done ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-300'
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {!isLast && <div className={`w-0.5 h-6 mt-1 rounded-full ${done && i < currentIndex ? 'bg-green-400' : 'bg-gray-100'}`} />}
                </div>
                <div className="pt-1 pb-5">
                  <p className={`text-xs font-black uppercase tracking-widest ${active ? 'text-orange-600' : done ? 'text-green-600' : 'text-gray-300'}`}>
                    {step.label}
                    {active && <span className="ml-2 animate-pulse">●</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {order.status === 'delivered' && (
          <Button
            onClick={() => onReview(order.id)}
            className="w-full h-12 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest rounded-2xl"
          >
            <Star className="w-4 h-4 mr-2" /> Leave a Review
          </Button>
        )}
      </div>
    </div>
  );
}

function ReviewModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: { food: rating, delivery: rating, comment } }),
      });
      setDone(true);
      setTimeout(onClose, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl space-y-6">
        {done ? (
          <div className="text-center space-y-3 py-4">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="font-black text-lg text-gray-900 uppercase italic">Review Submitted!</p>
          </div>
        ) : (
          <>
            <div>
              <p className="text-[0.6rem] font-black text-orange-500 uppercase tracking-widest">Rate Your Experience</p>
              <h2 className="text-2xl font-black text-gray-900 uppercase italic mt-1">Leave a Review</h2>
            </div>
            <div className="flex gap-2 justify-center">
              {[1,2,3,4,5].map((s) => (
                <button key={s} onClick={() => setRating(s)} className={`text-3xl transition-transform hover:scale-110 ${s <= rating ? 'text-orange-500' : 'text-gray-200'}`}>★</button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this meal..."
              className="w-full rounded-2xl border border-gray-200 p-4 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest">Cancel</Button>
              <Button onClick={submit} disabled={loading} className="flex-1 h-12 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest rounded-2xl">
                {loading ? 'Submitting…' : 'Submit'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await orderService.getOrders({ customer_id: user.id });
      setOrders(data);
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadOrders();
  }, [user, loadOrders]);

  // Real-time order status updates
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    const channel = supabase
      .channel('order-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `customer_id=eq.${user.id}`,
      }, (payload) => {
        const updated = payload.new as Order;
        setOrders((prev) => prev.map((o) => o.id === updated.id ? { ...o, ...updated } : o));
        // Update tracking modal if open
        setTrackingOrder((prev) => prev?.id === updated.id ? { ...prev, ...updated } : prev);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    setFilteredOrders(
      selectedStatus === 'all' ? orders : orders.filter((o) => o.status === selectedStatus)
    );
  }, [selectedStatus, orders]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-600/20 border-t-orange-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-black">
            🍱
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Login Required</h2>
          <p className="text-xs text-gray-500 font-medium">Please log in to track and view your authentic home-cooked meal orders.</p>
          <Button asChild className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl h-12 uppercase tracking-widest text-xs">
            <Link href="/login">Log In to Rasan</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-32">
      {/* Hero */}
      <div className="bg-[#1A1A1A] py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <p className="text-[0.6rem] font-black text-orange-500 uppercase tracking-widest">Intelligence Terminal</p>
          <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter mt-2">MY <span className="text-orange-600">ORDERS</span></h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-2">Real-time tracking enabled • {orders.length} total orders</p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-8 space-y-6 -mt-6 relative z-10">
        <div className="bg-white rounded-[2rem] p-4 shadow-xl border border-gray-100">
          <OrderFilters selectedStatus={selectedStatus} onStatusChange={setSelectedStatus} />
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-orange-600/20 border-t-orange-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading Orders…</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-20 text-center border border-gray-100 shadow-xl">
            <Package className="h-16 w-16 text-gray-200 mx-auto mb-6" />
            <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter">No Orders Found</h3>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-3">
              {selectedStatus === 'all' ? "You haven't placed any orders yet" : `No ${selectedStatus} orders found`}
            </p>
          </div>
        ) : (
          <OrderList
            orders={filteredOrders}
            onOrderUpdated={loadOrders}
            onTrackOrder={(order) => setTrackingOrder(order)}
          />
        )}
      </div>

      {trackingOrder && (
        <OrderTracker
          order={trackingOrder}
          onClose={() => setTrackingOrder(null)}
          onReview={(id) => { setTrackingOrder(null); setReviewOrderId(id); }}
        />
      )}
      {reviewOrderId && (
        <ReviewModal orderId={reviewOrderId} onClose={() => setReviewOrderId(null)} />
      )}
    </div>
  );
}
