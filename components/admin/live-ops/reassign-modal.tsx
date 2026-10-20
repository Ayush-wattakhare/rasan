'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/lib/hooks/use-toast';
import { Truck, Star, Loader2, ArrowRight, Sparkles } from 'lucide-react';

interface ReassignModalProps {
  order: any | null;
  isOpen: boolean;
  onClose: () => void;
  onReassigned: () => void;
}

type Rider = {
  id: string;
  name: string;
  phone: string | null;
  vehicle: string | null;
  rating: number | null;
  is_online: boolean;
  active_missions: number;
};

export function ReassignModal({ order, isOpen, onClose, onReassigned }: ReassignModalProps) {
  const { toast } = useToast();
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');
  const [reason, setReason] = useState('Rider unresponsive / delayed');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    setSelectedRiderId('');
    fetch('/api/admin/delivery-partners?online=1')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load riders');
        if (cancelled) return;
        // Least busy first; never offer the rider who already has the order.
        const list: Rider[] = (data.riders || [])
          .filter((r: Rider) => r.id !== order?.delivery_partner_id)
          .sort((a: Rider, b: Rider) => a.active_missions - b.active_missions);
        setRiders(list);
        if (list[0]) setSelectedRiderId(list[0].id);
      })
      .catch((err) => !cancelled && setLoadError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [isOpen, order?.delivery_partner_id]);

  if (!order) return null;

  const handleReassign = async () => {
    if (!selectedRiderId) {
      toast({ title: 'Please select a rider', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/live-ops/reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, targetRiderId: selectedRiderId, reason }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reassign rider');

      toast({ title: '🛵 Rider Assigned', description: data.message });
      onReassigned();
      onClose();
    } catch (err: any) {
      toast({
        title: 'Reassignment Failed',
        description: err.message || 'Could not transfer order.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl w-full p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white max-h-[90vh] flex flex-col my-auto">
        <div className="bg-[#121212] px-6 sm:px-8 py-5 text-white relative shrink-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/20 rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none" />
          <div className="relative z-10 space-y-1 pr-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-blue-400 text-[0.6rem] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3" aria-hidden="true" /> Dispatch
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-black uppercase italic tracking-tight text-white leading-tight">
              {order.delivery_partner_id ? 'Reassign' : 'Assign'}{' '}
              <span className="text-blue-500">#{order.order_number || order.id?.slice(0, 8).toUpperCase()}</span>
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-xs font-semibold">
              Choose an online, verified rider. The customer and both riders are notified.
            </DialogDescription>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Destination:</span>
              <span className="font-bold text-gray-900 text-right">
                {typeof order.delivery_address === 'string' ? order.delivery_address : order.delivery_address?.street || '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Order Total:</span>
              <span className="font-black text-green-600">₹{order.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Current Rider:</span>
              <span className="font-bold text-gray-900">{order.rider_name || 'None'}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-wider text-gray-700">Online Riders</Label>
            {loading ? (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" aria-label="Loading riders" />
              </div>
            ) : loadError ? (
              <p role="alert" className="text-xs font-semibold text-red-600">{loadError}</p>
            ) : riders.length === 0 ? (
              <p className="text-xs font-semibold text-gray-500 p-4 bg-gray-50 rounded-2xl">
                No other verified rider is online right now.
              </p>
            ) : (
              <div className="grid gap-2.5" role="radiogroup" aria-label="Riders">
                {riders.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    role="radio"
                    aria-checked={selectedRiderId === r.id}
                    onClick={() => setSelectedRiderId(r.id)}
                    className={`p-4 rounded-2xl border text-left transition flex items-center justify-between ${
                      selectedRiderId === r.id
                        ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-600/20'
                        : 'border-gray-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                        <Truck className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-gray-900">{r.name}</div>
                        <div className="text-[0.65rem] text-gray-500 font-mono">
                          {[r.vehicle, r.phone].filter(Boolean).join(' • ') || '—'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      {r.rating !== null && r.rating > 0 && (
                        <span className="flex items-center justify-end gap-1 text-xs font-bold text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-500" aria-hidden="true" /> {r.rating.toFixed(1)}
                        </span>
                      )}
                      <span className="text-[0.6rem] font-bold uppercase text-gray-400 block">
                        {r.active_missions === 0 ? 'Free' : `${r.active_missions} active`}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reassign-reason" className="text-xs font-black uppercase tracking-wider text-gray-700">
              Reason
            </Label>
            <Textarea
              id="reassign-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="rounded-xl text-xs min-h-[70px]"
            />
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-100 bg-white flex gap-3 shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1 h-12 rounded-xl text-xs font-bold uppercase">
            Cancel
          </Button>
          <Button
            disabled={isSubmitting || !selectedRiderId}
            onClick={handleReassign}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase rounded-xl flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (<>Confirm <ArrowRight className="w-4 h-4" aria-hidden="true" /></>)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
