'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber?: string | number;
  totalAmount: number;
  currentStatus: string;
  onSuccess?: (paymentStatus?: string) => void;
}

const CANCELLATION_REASONS = [
  'Placed order by mistake',
  'Need to change delivery address',
  'Want to modify meal items / quantity',
  'Delivery time is taking too long',
  'Other reason',
];

export function CancelOrderModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  totalAmount,
  currentStatus,
  onSuccess,
}: CancelOrderModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedReason, setSelectedReason] = useState(CANCELLATION_REASONS[0]);
  const [customNote, setCustomNote] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const isFullRefund = ['pending', 'confirmed'].includes(currentStatus);

  const handleConfirmCancel = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCancelling(true);

    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: selectedReason === 'Other reason' ? customNote || selectedReason : selectedReason,
        }),
      });

      const data = await res.json();

      if (!res.ok && !data.alreadyCancelled) {
        throw new Error(data.error || 'Failed to cancel order');
      }

      // The server decides the refund (only money actually paid is refunded).
      toast({
        title: 'Order Cancelled Successfully',
        description: data.cancellation?.policyReason || 'Order cancellation has been processed.',
      });

      onClose();
      if (onSuccess) {
        onSuccess(data.cancellation?.paymentStatus);
      }
      router.refresh();
    } catch (err: any) {
      toast({
        title: 'Cancellation Failed',
        description: err.message || 'Could not cancel order. Please contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div
        className="bg-white rounded-[2.5rem] max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-gray-100 max-h-[85vh] overflow-y-auto my-auto animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3.5 mb-6">
          <div className="bg-red-100 p-3 rounded-2xl text-red-600 shadow-sm">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Cancel Order</h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              {orderNumber ? `Order #${orderNumber}` : `ID: ${orderId.slice(0, 8)}`}
            </p>
          </div>
        </div>

        {/* Refund Policy Banner */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                {isFullRefund ? '100% Full Refund Guarantee' : 'Partial Refund Policy'}
              </p>
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                {isFullRefund
                  ? `Because preparation has not started yet, you will receive a full 100% refund of ₹${totalAmount.toFixed(2)} back to your original payment method.`
                  : 'Food preparation is in progress. A partial refund will be applied.'}
              </p>
            </div>
          </div>
        </div>

        {/* Reason Selector */}
        <div className="space-y-4 mb-6">
          <label className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400 block">
            Reason for Cancellation
          </label>
          <div className="space-y-2">
            {CANCELLATION_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer text-xs font-bold ${
                  selectedReason === reason
                    ? 'border-red-500 bg-red-50/40 text-red-950'
                    : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="cancel_reason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="text-red-600 focus:ring-red-500"
                />
                <span className="flex-1">{reason}</span>
              </label>
            ))}
          </div>

          {selectedReason === 'Other reason' && (
            <textarea
              placeholder="Please describe why you are cancelling..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full p-3 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-red-500 min-h-[70px]"
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            disabled={isCancelling}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-500"
          >
            Keep Order
          </Button>
          <Button
            type="button"
            onClick={handleConfirmCancel}
            disabled={isCancelling}
            className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isCancelling ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Cancelling...
              </>
            ) : (
              'Confirm Cancel'
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
