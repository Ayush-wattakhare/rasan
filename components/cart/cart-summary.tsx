'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Info, Sparkles, Tag } from 'lucide-react';

interface CartSummaryProps {
  subtotal: number;
  baseSubtotal?: number;
  totalSavings?: number;
  platformFee: number;
  deliveryFee: number;
  total: number;
  onCheckout?: () => void;
  checkoutLabel?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export function CartSummary({
  subtotal,
  baseSubtotal,
  totalSavings = 0,
  platformFee,
  deliveryFee,
  total,
  onCheckout,
  checkoutLabel = 'Proceed to Checkout',
}: CartSummaryProps) {
  const originalSubtotal = baseSubtotal && baseSubtotal > subtotal ? baseSubtotal : subtotal + totalSavings;

  return (
    <Card className="border border-gray-100 shadow-xl bg-white rounded-3xl overflow-hidden">
      <CardHeader className="pb-4 pt-6 px-6 sm:px-8 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">
            🧾
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-white flex flex-col">
            Order Summary
            <span className="text-xs font-medium text-gray-400 mt-0.5">
              Secure Transaction
            </span>
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-6 sm:p-8 space-y-6">
        <div className="space-y-3.5">
          {/* Base subtotal before discount if savings exist */}
          {totalSavings > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Items Total (Before Discount)</span>
              <span className="text-gray-400 line-through font-semibold">
                {formatCurrency(originalSubtotal)}
              </span>
            </div>
          )}

          {/* Plan Savings */}
          {totalSavings > 0 && (
            <div className="flex justify-between items-center text-sm bg-green-50 p-2.5 rounded-xl border border-green-200">
              <span className="text-green-800 font-bold flex items-center gap-1.5 text-xs">
                <Tag className="w-3.5 h-3.5" /> Plan Discount Savings
              </span>
              <span className="text-green-700 font-extrabold text-sm">
                -{formatCurrency(totalSavings)}
              </span>
            </div>
          )}

          {/* Discounted Bag Subtotal */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 font-semibold">Bag Subtotal</span>
            <span className="text-base font-bold text-gray-900">
              {formatCurrency(subtotal)}
            </span>
          </div>

          {/* Delivery */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 font-semibold">Home Chef Delivery</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 line-through">₹49</span>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                FREE
              </span>
            </div>
          </div>

          {/* Platform fee */}
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 font-semibold">Platform Fee</span>
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(platformFee)}
            </span>
          </div>

          {/* Total */}
          <div className="pt-4 border-t border-gray-100 flex justify-between items-baseline">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                Total Amount
              </span>
              <span className="text-[0.65rem] text-gray-400">
                (Includes all taxes & delivery)
              </span>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-orange-600 tracking-tight">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Savings banner */}
        {totalSavings > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 text-xs font-bold text-orange-900">
            <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
            <span>You are saving {formatCurrency(totalSavings)} with your subscription plan!</span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <Button
            size="lg"
            className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white font-bold text-base rounded-2xl shadow-lg transition-all"
            onClick={onCheckout}
          >
            <span>{checkoutLabel}</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 font-medium">
            <Info className="w-3.5 h-3.5 text-gray-400" />
            <span>FSSAI Certified Home Kitchens • Safe & Hygienic</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
