'use client';

import { useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { MapPin, Phone, Mail, Package, CreditCard, AlertTriangle, ShieldCheck, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CancelOrderModal } from './cancel-order-modal';
import type { Order } from '@/lib/supabase/types';

interface OrderDetailsProps {
  order: Order;
  onOrderUpdated?: () => void;
}

const paymentMethodLabels: Record<Order['payment_method'], string> = {
  cash: 'Cash on Delivery',
  card: 'Credit/Debit Card',
  upi: 'UPI',
  wallet: 'Wallet',
};

export function OrderDetails({ order, onOrderUpdated }: OrderDetailsProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);

  const canCancel = order.status === 'pending';
  const isCancelled = order.status === 'cancelled';

  return (
    <>
      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        orderId={order.id}
        orderNumber={order.order_number}
        totalAmount={order.total}
        currentStatus={order.status}
        onSuccess={onOrderUpdated}
      />

      <div className="space-y-6">
        {/* Cancellation Alert if Cancelled */}
        {isCancelled && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-3xl flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-red-900">This Order Has Been Cancelled</p>
              <p className="text-xs text-red-700 mt-0.5">
                {order.payment_status === 'refunded'
                  ? 'Your refund has been processed back to your payment method.'
                  : 'Order cancelled before delivery.'}
              </p>
            </div>
          </div>
        )}

        {/* Order Items */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-gray-50/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-black text-gray-900">
              <Package className="h-5 w-5 text-orange-600" />
              Order Items
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400 font-semibold">
                      <span>Qty: {item.quantity}</span>
                      <span>₹{item.price.toFixed(2)} each</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-gray-900 text-sm">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-gray-500">
                  <span>Subtotal</span>
                  <span className="text-gray-900 font-bold">₹{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-gray-500">
                  <span>Delivery Fee</span>
                  <span className="text-gray-900 font-bold">₹{order.delivery_fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-gray-500">
                  <span>Tax & Platform Fee</span>
                  <span className="text-gray-900 font-bold">₹{order.tax.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-xs font-bold text-green-600">
                    <span>Discount</span>
                    <span>-₹{order.discount.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-black text-base text-gray-900 pt-1">
                  <span>Total Paid</span>
                  <span className="text-xl text-orange-600 font-black">₹{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Address */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-gray-50/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-black text-gray-900">
              <MapPin className="h-5 w-5 text-orange-600" />
              Delivery Destination
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-1 text-sm font-semibold text-gray-800">
              <p className="font-bold text-gray-900">{order.delivery_address.street}</p>
              <p className="text-xs text-gray-500">
                {order.delivery_address.city}, {order.delivery_address.state} - {order.delivery_address.zip_code}
              </p>
            </div>
            {order.delivery_instructions && (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-1">
                    Delivery Instructions
                  </p>
                  <p className="text-xs text-gray-600 font-medium">
                    {order.delivery_instructions}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-gray-50/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-black text-gray-900">
              <CreditCard className="h-5 w-5 text-orange-600" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Payment Mode</span>
                <span className="font-black text-gray-900">
                  {paymentMethodLabels[order.payment_method]}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Status</span>
                <Badge
                  className={
                    order.payment_status === 'paid'
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : order.payment_status === 'refunded'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }
                >
                  {order.payment_status.toUpperCase()}
                </Badge>
              </div>
              {order.payment_id && (
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-gray-400 uppercase tracking-wider">Reference ID</span>
                  <span className="font-mono text-gray-600">{order.payment_id}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cancel Order Action Button - Only visible while order is pending */}
        {canCancel && (
          <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-gray-900">Need to cancel?</h4>
                <p className="text-xs text-gray-400 font-medium">
                  100% refund available before the kitchen confirms your order.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(true)}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold text-xs uppercase tracking-wider rounded-xl h-10 px-4"
              >
                Cancel Order
              </Button>
            </div>
          </div>
        )}

        {/* Informative notice once order is confirmed and locked */}
        {!canCancel && !isCancelled && !['delivered'].includes(order.status) && (
          <div className="p-4 bg-orange-50/60 border border-orange-100 rounded-3xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Order Confirmed by Kitchen</p>
              <p className="text-[0.65rem] text-gray-500 font-medium">
                Your food is actively being prepared with fresh ingredients and can no longer be cancelled.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
