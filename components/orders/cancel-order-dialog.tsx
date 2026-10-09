'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/lib/hooks/use-toast';
import { AlertTriangle, X, ShieldAlert, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CancelOrderDialogProps {
  orderId: string;
  orderStatus: string;
  totalAmount: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function CancelOrderDialog({
  orderId,
  orderStatus,
  totalAmount,
  isOpen,
  onClose,
}: CancelOrderDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  // Calculate policy preview
  const getPolicyPreview = () => {
    if (['pending', 'confirmed'].includes(orderStatus)) {
      return {
        percent: 100,
        amount: totalAmount,
        color: 'text-green-600 bg-green-50 border-green-200',
        badge: '100% Full Refund',
        note: 'Order has not entered kitchen preparation yet.',
      };
    } else if (orderStatus === 'preparing') {
      return {
        percent: 50,
        amount: totalAmount * 0.5,
        color: 'text-orange-600 bg-orange-50 border-orange-200',
        badge: '50% Partial Refund',
        note: 'Kitchen preparation in progress. 50% covers ingredient costs.',
      };
    } else {
      return {
        percent: 0,
        amount: 0,
        color: 'text-red-600 bg-red-50 border-red-200',
        badge: 'Non-refundable',
        note: 'Order is out for delivery with active courier rider.',
      };
    }
  };

  const policy = getPolicyPreview();

  const handleCancelOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel order');
      }

      setResult(data.cancellation);
      toast({
        title: 'Order Cancelled',
        description: data.cancellation.policyReason,
      });
      router.refresh();
    } catch (err: any) {
      toast({
        title: 'Cancellation Failed',
        description: err.message || 'Could not process cancellation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-gray-100 max-h-[85vh] overflow-y-auto my-auto animate-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {result ? (
          <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto text-orange-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-gray-900 uppercase italic">Cancellation Processed</h3>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{result.policyReason}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2 text-left">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-400 uppercase">Refund Percentage</span>
                <span className="text-gray-900 font-black">{result.refundPercentage}%</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-gray-400 uppercase">Amount Refunded</span>
                <span className="text-orange-600 font-black text-sm">₹{result.refundAmount.toFixed(2)}</span>
              </div>
            </div>
            <Button
              onClick={onClose}
              className="w-full bg-[#1A1A1A] hover:bg-orange-600 text-white font-black uppercase tracking-widest h-12 rounded-xl"
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-3 rounded-2xl text-red-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Cancel Order #{orderId.slice(0, 8)}</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Review Cancellation & Refund Policy</p>
              </div>
            </div>

            {/* Policy Banner */}
            <div className={`p-4 rounded-2xl border ${policy.color} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest">{policy.badge}</span>
                <span className="text-lg font-black italic">₹{policy.amount.toFixed(2)}</span>
              </div>
              <p className="text-[0.65rem] font-bold uppercase tracking-wider opacity-90">{policy.note}</p>
            </div>

            {/* Refund Rules List */}
            <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <h4 className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest">Platform Policy Rules</h4>
              <ul className="space-y-1.5 text-[0.65rem] text-gray-600 font-semibold">
                <li className="flex items-center gap-2">• Pending / Confirmed: <strong className="text-green-600">100% Full Refund</strong></li>
                <li className="flex items-center gap-2">• Preparing: <strong className="text-orange-600">50% Refund</strong> (ingredient cost offset)</li>
                <li className="flex items-center gap-2">• Out for Delivery: <strong className="text-red-600">0% Refund</strong></li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={loading}
                className="flex-1 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-500"
              >
                Keep Order
              </Button>
              <Button
                onClick={handleCancelOrder}
                disabled={loading || policy.percent === 0}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
