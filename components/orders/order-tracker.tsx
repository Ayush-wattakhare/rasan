'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation, Clock, CheckCircle, Zap, Home, XCircle, AlertTriangle, RefreshCcw, KeyRound } from 'lucide-react';
import { CancelOrderModal } from './cancel-order-modal';
import type { Order } from '@/lib/supabase/types';
import { format } from 'date-fns';
import { getDeliveryOtp } from '@/lib/utils/delivery-otp';

// Dynamic import keeps Leaflet out of SSR bundle
const OrderLiveMap = dynamic(() => import('@/components/orders/order-live-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[340px] rounded-2xl bg-[#1A1A1A] animate-pulse flex items-center justify-center">
      <p className="text-[0.6rem] font-black text-gray-600 uppercase tracking-widest">Loading Map…</p>
    </div>
  ),
});

interface OrderTrackerProps {
  order: Order;
  onOrderUpdated?: (order: Order) => void;
  onClose?: () => void;
  onReview?: (orderId: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

// Default vendor/delivery coordinates
const VENDOR_LOCATION = { lat: 18.6279, lng: 73.8009 };

export function OrderTracker({
  order,
  onOrderUpdated,
  onClose,
  onReview,
  onRefresh,
  isRefreshing: parentRefreshing,
}: OrderTrackerProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [localRefreshing, setLocalRefreshing] = useState(false);

  const isRefreshing = parentRefreshing ?? localRefreshing;

  const handleRefresh = async () => {
    if (onRefresh) {
      onRefresh();
      return;
    }
    if (onOrderUpdated) {
      try {
        setLocalRefreshing(true);
        const res = await fetch(`/api/orders/${order.id}`);
        if (!res.ok) return;
        const data: Order = await res.json();
        if (data && data.status) {
          onOrderUpdated(data);
        }
      } catch (err) {
        console.warn('Order refresh error:', err);
      } finally {
        setLocalRefreshing(false);
      }
    }
  };

  const STEPS = [
    { id: 'confirmed', label: 'Order Confirmed', Icon: CheckCircle, color: 'bg-green-500' },
    { id: 'preparing', label: 'Food Being Prepared', Icon: Zap, color: 'bg-orange-500' },
    { id: 'out_for_delivery', label: 'Out for Delivery', Icon: Navigation, color: 'bg-blue-500' },
    { id: 'delivered', label: 'Delivered', Icon: Home, color: 'bg-green-600' },
  ];
  const ORDER_SEQUENCE = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'out_for_delivery', 'delivered'];
  const currentStep = ORDER_SEQUENCE.indexOf(order.status);

  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';
  const isEnRoute = order.status === 'out_for_delivery';
  const canCancel = ['pending', 'confirmed'].includes(order.status);

  // Try to extract delivery coords from delivery_address field
  const deliveryCoords = (() => {
    const addr = (order as any).delivery_address;
    if (addr?.coordinates?.lat && addr?.coordinates?.lng) {
      return { lat: addr.coordinates.lat, lng: addr.coordinates.lng };
    }
    if (addr?.lat && addr?.lng) return { lat: addr.lat, lng: addr.lng };
    if (addr?.latitude && addr?.longitude) return { lat: addr.latitude, lng: addr.longitude };
    return { lat: VENDOR_LOCATION.lat + 0.015, lng: VENDOR_LOCATION.lng + 0.012 };
  })();

  return (
    <>
      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        orderId={order.id}
        orderNumber={order.order_number}
        totalAmount={order.total}
        currentStatus={order.status}
        onSuccess={(paymentStatus) => {
          onRefresh?.();
          onOrderUpdated?.({
            ...order,
            status: 'cancelled',
            payment_status: (paymentStatus as typeof order.payment_status) || order.payment_status,
          });
        }}
      />

      <div className="space-y-6">
        {/* Cancelled Banner */}
        {isCancelled && (
          <div className="p-5 bg-red-50 border border-red-200 rounded-[2rem] flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-red-950 uppercase tracking-tight">Order Cancelled</h4>
                <p className="text-xs text-red-700 font-medium">Full refund processed to your payment method.</p>
              </div>
            </div>
            <span className="text-[0.65rem] font-black uppercase tracking-wider bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200">
              Cancelled
            </span>
          </div>
        )}

        {/* -- Live Map ------------------------------------------------------------ */}
        {!isCancelled && (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-20 group-hover:opacity-30 transition duration-500" />
            <div className="relative bg-[#111] rounded-[2rem] p-5 shadow-xl border border-white/5 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  <span className="text-[0.6rem] font-black text-blue-400 uppercase tracking-widest italic">
                    Live Delivery Tracking
                  </span>
                </div>
                <span className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">
                  {isDelivered ? '✓ Delivered' : isEnRoute ? '🛵 En Route' : '👨‍🍳 Kitchen Prep'}
                </span>
              </div>

              {/* The actual map */}
              <OrderLiveMap
                orderId={order.id}
                vendorLocation={VENDOR_LOCATION}
                deliveryLocation={deliveryCoords}
                deliveryPartnerId={(order as any).delivery_partner_id || undefined}
              />

              {/* ETA chip */}
              {!isDelivered && (
                <div className="mt-4 flex justify-center">
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-3">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <div>
                      <p className="text-[0.55rem] font-black text-gray-500 uppercase tracking-widest">Estimated Arrival</p>
                      <p className="text-base font-black text-white">~12 mins</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
 
        {/* -- Delivery Handover OTP PIN ------------------------------------------- */}
        {!isDelivered && !isCancelled && (
          <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-orange-200" />
                  <span className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-orange-100">
                    Handover Security PIN
                  </span>
                </div>
                <h4 className="text-sm font-black uppercase tracking-tight text-white">Share with Rider at Doorstep</h4>
                <p className="text-[0.65rem] text-orange-100/90 font-medium">Your rider will enter this 4-digit PIN to verify meal handover.</p>
              </div>
              <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl px-5 py-3 text-center shrink-0 shadow-inner">
                <p className="text-[0.55rem] font-black uppercase tracking-widest text-orange-100">DELIVERY OTP</p>
                <p className="text-3xl font-black tracking-widest font-mono text-white mt-0.5">{getDeliveryOtp(order)}</p>
              </div>
            </div>
          </div>
        )}

        {/* -- Status Timeline ----------------------------------------------------- */}
        <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Order Progress</h3>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-600 transition cursor-pointer"
                title="Refresh live status"
              >
                <RefreshCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
              </button>
            </div>
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(true)}
                className="h-8 px-3 text-[0.65rem] font-black uppercase tracking-wider text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel Order
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {STEPS.map((step) => {
              const stepIdx = ORDER_SEQUENCE.indexOf(step.id);
              const isCompleted = !isCancelled && currentStep >= stepIdx;
              const isCurrent = !isCancelled && currentStep === stepIdx;
              const update = (order as any).tracking_updates?.find((u: any) => u.status === step.id);
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-4 transition-all duration-500 ${
                    isCompleted ? 'opacity-100' : 'opacity-35 grayscale'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform ${
                      isCurrent ? 'animate-pulse scale-110' : ''
                    } ${step.color}`}
                  >
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <step.Icon className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{step.label}</h4>
                      {update && (
                        <span className="text-[0.65rem] font-bold text-gray-400">
                          {format(new Date(update.timestamp), 'h:mm a')}
                        </span>
                      )}
                    </div>
                    {isCurrent && (
                      <p className="text-[0.65rem] font-bold text-blue-500 uppercase tracking-widest mt-0.5 animate-pulse">
                        Now Happening · Active
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* -- Info cards --------------------------------------------------------- */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
              <Navigation className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-tighter mb-1">Smart Assignment</h4>
            <p className="text-[0.65rem] text-gray-400 font-medium leading-relaxed">
              Auto-assigned to the nearest neighbourhood partner.
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-tighter mb-1">35 Min Average</h4>
            <p className="text-[0.65rem] text-gray-400 font-medium leading-relaxed">
              Hyperlocal focus ensures fresh, hot meals every time.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
