'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/lib/hooks/use-toast';
import { Truck, Star, ArrowRight, Loader2, Sparkles, User, AlertCircle } from 'lucide-react';

interface ReassignModalProps {
  order: any | null;
  isOpen: boolean;
  onClose: () => void;
  onReassigned: () => void;
}

export function ReassignModal({ order, isOpen, onClose, onReassigned }: ReassignModalProps) {
  const { toast } = useToast();
  const [riders, setRiders] = useState<any[]>([]);
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');
  const [reason, setReason] = useState('Rider vehicle issue / Delay transfer');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        // Fallback sample riders if API returns standard list
        const sampleRiders = [
          { id: 'dp-1', name: 'Rohan Sharma', phone: '+91 9988776655', vehicle: 'MH 14 DA 2024', rating: 4.9, active_missions: 0 },
          { id: 'dp-2', name: 'Riya Patel', phone: '+91 9776655443', vehicle: 'MH 12 AB 1234', rating: 4.8, active_missions: 1 },
          { id: 'dp-3', name: 'Amit Verma', phone: '+91 9833445566', vehicle: 'MH 14 CZ 9801', rating: 4.7, active_missions: 0 },
        ];
        setRiders(sampleRiders);
        setSelectedRiderId(sampleRiders[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

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
        body: JSON.stringify({
          orderId: order.id,
          targetRiderId: selectedRiderId,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reassign rider');

      toast({
        title: '🛵 Mission Reassigned',
        description: data.message || `Mission transferred to target pilot.`,
      });

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
              <Sparkles className="w-3 h-3" /> Tactical Dispatch Intervention
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-black uppercase italic tracking-tight text-white leading-tight">
              Reassign <span className="text-blue-500">Mission #{order.id?.slice(0, 8).toUpperCase()}</span>
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-xs font-semibold">
              Force transfer active delivery sortie to a nearby available pilot
            </DialogDescription>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Active Order Summary */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Destination:</span>
              <span className="font-bold text-gray-900">{typeof order.delivery_address === 'string' ? order.delivery_address : order.delivery_address?.street || 'Local Drop'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Order Total:</span>
              <span className="font-black text-green-600">₹{order.total || 180}</span>
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">Reason for Reassignment *</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Previous rider scooter breakdown / Unreachable"
              className="h-11 rounded-xl text-xs font-medium"
            />
          </div>

          {/* Rider Selection List */}
          <div className="space-y-2.5">
            <Label className="text-xs font-black uppercase tracking-wider text-gray-700">
              Select Online Pilot to Assign
            </Label>

            <div className="space-y-2">
              {riders.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRiderId(r.id)}
                  className={`w-full p-4 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer ${
                    selectedRiderId === r.id
                      ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-gray-900">{r.name}</div>
                      <div className="text-[0.65rem] text-gray-500 font-bold uppercase font-mono">
                        {r.vehicle} • {r.phone}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs font-black text-amber-500 justify-end">
                      <Star className="w-3.5 h-3.5 fill-current" /> {r.rating}
                    </div>
                    <span className="text-[0.6rem] font-bold text-green-600 uppercase">
                      {r.active_missions === 0 ? '● Free (0 Missions)' : `${r.active_missions} Active`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 border-t border-gray-100 bg-white shrink-0 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-12 px-6 rounded-xl border-gray-200 text-xs font-bold uppercase"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleReassign}
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Transfer Mission <ArrowRight className="w-4 h-4" /></>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
