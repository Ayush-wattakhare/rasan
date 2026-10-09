'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/lib/hooks/use-toast';
import { AlertTriangle, IndianRupee, Loader2, ArrowRight } from 'lucide-react';

interface CancelOrderModalProps {
  order: any | null;
  isOpen: boolean;
  onClose: () => void;
  onCancelled: () => void;
}

export function CancelOrderModal({ order, isOpen, onClose, onCancelled }: CancelOrderModalProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState('Customer requested cancellation / Operational issue');
  const [fault, setFault] = useState<'customer' | 'vendor' | 'logistics' | 'weather'>('logistics');
  const [refundCustomer, setRefundCustomer] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!order) return null;

  const handleCancel = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/live-ops/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          reason,
          faultAttribution: fault,
          refundCustomer,
          refundAmount: order.total || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel order');

      toast({
        title: 'Order Cancelled',
        description: data.message || `Order #${order.id.slice(0, 8)} marked as cancelled.`,
      });

      onCancelled();
      onClose();
    } catch (err: any) {
      toast({
        title: 'Cancellation Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white max-h-[90vh] flex flex-col my-auto">
        <div className="bg-[#1A1A1A] px-6 py-5 text-white relative shrink-0">
          <div className="relative z-10 space-y-1">
            <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[0.6rem] font-black uppercase tracking-wider">
              Emergency Cancellation
            </span>
            <DialogTitle className="text-xl font-black uppercase italic tracking-tight text-white leading-tight">
              Cancel Order #{order.id?.slice(0, 8).toUpperCase()}
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-xs font-semibold">
              Cancel mission and determine fault attribution & refunds
            </DialogDescription>
          </div>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">Fault Attribution</Label>
            <select
              value={fault}
              onChange={(e) => {
                const f = e.target.value as any;
                setFault(f);
                if (f === 'vendor' || f === 'logistics' || f === 'weather') setRefundCustomer(true);
              }}
              className="w-full h-11 px-3 border border-gray-200 rounded-xl bg-white text-xs font-bold"
            >
              <option value="logistics">Logistics / Rider Delay (100% Refund)</option>
              <option value="vendor">Vendor Kitchen Delay (100% Refund)</option>
              <option value="weather">Severe Weather / Road Closed (100% Refund)</option>
              <option value="customer">Customer Changed Mind (No refund if cooking)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">Reason Note</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="rounded-xl text-xs min-h-[80px]"
            />
          </div>

          <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer">
            <input
              type="checkbox"
              checked={refundCustomer}
              onChange={(e) => setRefundCustomer(e.target.checked)}
              className="w-4 h-4 text-orange-600 rounded"
            />
            <span className="text-xs font-bold text-gray-800">
              Issue Full Refund of ₹{order.total || 0} to Customer
            </span>
          </label>
        </div>

        <div className="p-4 border-t border-gray-100 bg-white flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11 rounded-xl text-xs font-bold uppercase">
            Keep Order
          </Button>
          <Button
            disabled={isSubmitting}
            onClick={handleCancel}
            className="flex-1 h-11 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase rounded-xl"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Cancel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
