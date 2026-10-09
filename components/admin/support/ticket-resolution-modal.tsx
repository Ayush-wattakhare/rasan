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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/lib/hooks/use-toast';
import { 
  ShieldCheck, 
  IndianRupee, 
  Truck, 
  ChefHat, 
  MessageSquare, 
  CheckCircle2, 
  Loader2, 
  Sparkles,
  AlertTriangle,
  User,
  Clock,
  ArrowRight
} from 'lucide-react';
import type { SupportTicket } from '@/app/api/admin/support/tickets/route';

interface TicketResolutionModalProps {
  ticket: SupportTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function TicketResolutionModal({
  ticket,
  isOpen,
  onClose,
  onUpdated,
}: TicketResolutionModalProps) {
  const { toast } = useToast();
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [compensationAmount, setCompensationAmount] = useState('');
  const [status, setStatus] = useState<SupportTicket['status']>('resolved');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!ticket) return null;

  const handleApplyResolution = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/support/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: ticket.id,
          status,
          resolutionNotes: resolutionNotes.trim() || `Resolved with admin intervention.`,
          refundAmount: refundAmount ? parseFloat(refundAmount) : undefined,
          compensationAmount: compensationAmount ? parseFloat(compensationAmount) : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update ticket');
      }

      // If refund was entered, log into refunds ledger
      if (refundAmount && parseFloat(refundAmount) > 0) {
        await fetch('/api/admin/refunds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: ticket.order_id || 'N/A',
            recipientId: ticket.user_id,
            recipientRole: ticket.user_role,
            recipientName: ticket.user_name,
            amount: parseFloat(refundAmount),
            type: ticket.user_role === 'customer' ? 'customer_refund' : 'vendor_compensation',
            reason: `Resolution for Ticket #${ticket.ticket_number}: ${ticket.subject}`,
            gateway: 'upi',
          }),
        });
      }

      toast({
        title: '🎉 Resolution Dispatched',
        description: `Ticket #${ticket.ticket_number} marked as ${status.toUpperCase()}. User notified.`,
      });

      onUpdated();
      onClose();
    } catch (err: any) {
      toast({
        title: 'Update Failed',
        description: err.message || 'Could not resolve ticket.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl w-full p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white max-h-[90vh] flex flex-col my-auto">
        {/* Header */}
        <div className="bg-[#1A1A1A] px-6 sm:px-8 py-5 text-white relative shrink-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-orange-600/20 rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none" />
          
          <div className="relative z-10 space-y-1 pr-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-orange-400 text-[0.6rem] font-black uppercase tracking-wider font-mono">
                #{ticket.ticket_number}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[0.55rem] font-black uppercase tracking-wider ${
                ticket.priority === 'critical' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
              }`}>
                {ticket.priority} Priority
              </span>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-black uppercase italic tracking-tight text-white leading-tight">
              Dispute <span className="text-orange-500">Resolution Console</span>
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-xs font-semibold">
              Review claim, apply financial compensation, and dispatch customer / partner resolution
            </DialogDescription>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Ticket Context Card */}
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                  ticket.user_role === 'customer' ? 'bg-orange-100 text-orange-700' :
                  ticket.user_role === 'vendor' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {ticket.user_role === 'customer' ? <User className="w-4 h-4" /> :
                   ticket.user_role === 'vendor' ? <ChefHat className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-black text-gray-900">{ticket.user_name}</div>
                  <div className="text-[0.65rem] text-gray-400 font-bold uppercase tracking-wider">
                    {ticket.user_role.toUpperCase()} • {ticket.user_email} {ticket.user_phone ? `• ${ticket.user_phone}` : ''}
                  </div>
                </div>
              </div>

              {ticket.order_id && (
                <div className="text-right">
                  <div className="text-[0.6rem] font-black uppercase text-gray-400">Order Ref</div>
                  <div className="font-mono text-xs font-black text-gray-900">#{ticket.order_id}</div>
                  {ticket.order_total && <div className="text-[0.65rem] font-black text-green-600">₹{ticket.order_total}</div>}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-black text-gray-900">{ticket.subject}</h4>
              <p className="text-xs text-gray-600 leading-relaxed font-medium bg-white p-3 rounded-xl border border-gray-100">
                &ldquo;{ticket.description}&rdquo;
              </p>
            </div>
          </div>

          {/* Quick Action Presets */}
          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-wider text-gray-700">
              Quick Settlement Triggers
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {ticket.user_role === 'customer' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setRefundAmount(ticket.order_total ? (ticket.order_total * 0.5).toFixed(0) : '50');
                      setResolutionNotes(`Issued 50% partial refund of ₹${ticket.order_total ? (ticket.order_total * 0.5).toFixed(0) : '50'} for reported issue.`);
                      setStatus('resolved');
                    }}
                    className="p-3 rounded-xl border border-orange-200 bg-orange-50/50 hover:bg-orange-100 text-left transition text-xs font-bold text-orange-950"
                  >
                    <IndianRupee className="w-4 h-4 text-orange-600 mb-1" />
                    <div>50% Partial Refund</div>
                    <div className="text-[0.6rem] text-orange-600">Missing item / delay</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRefundAmount(ticket.order_total ? ticket.order_total.toString() : '100');
                      setResolutionNotes(`Issued 100% full refund of ₹${ticket.order_total || '100'} to original payment source.`);
                      setStatus('resolved');
                    }}
                    className="p-3 rounded-xl border border-green-200 bg-green-50/50 hover:bg-green-100 text-left transition text-xs font-bold text-green-950"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-600 mb-1" />
                    <div>100% Full Refund</div>
                    <div className="text-[0.6rem] text-green-600">Spilled / Undelivered</div>
                  </button>
                </>
              )}

              {ticket.user_role === 'vendor' && (
                <button
                  type="button"
                  onClick={() => {
                    setCompensationAmount(ticket.order_total ? (ticket.order_total * 0.7).toFixed(0) : '100');
                    setResolutionNotes(`Compensated kitchen ₹${ticket.order_total ? (ticket.order_total * 0.7).toFixed(0) : '100'} (70% food cost) for unfulfilled pickup.`);
                    setStatus('resolved');
                  }}
                  className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-left transition text-xs font-bold text-amber-950"
                >
                  <ChefHat className="w-4 h-4 text-amber-600 mb-1" />
                  <div>Reimburse Wastage</div>
                  <div className="text-[0.6rem] text-amber-600">70% Food Cost Credit</div>
                </button>
              )}

              {ticket.user_role === 'delivery' && (
                <button
                  type="button"
                  onClick={() => {
                    setCompensationAmount('40');
                    setResolutionNotes('Credited ₹40 waiting allowance to rider for prolonged kitchen waiting delay.');
                    setStatus('resolved');
                  }}
                  className="p-3 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-left transition text-xs font-bold text-blue-950"
                >
                  <Clock className="w-4 h-4 text-blue-600 mb-1" />
                  <div>+₹40 Wait Charge</div>
                  <div className="text-[0.6rem] text-blue-600">Kitchen Delay Credit</div>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setResolutionNotes('Explained delivery protocol and resolved inquiry. No financial deduction required.');
                  setStatus('resolved');
                }}
                className="p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-left transition text-xs font-bold text-gray-800"
              >
                <MessageSquare className="w-4 h-4 text-gray-500 mb-1" />
                <div>Standard Resolution</div>
                <div className="text-[0.6rem] text-gray-500">Close without refund</div>
              </button>
            </div>
          </div>

          {/* Refund / Compensation Amount Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Refund Amount (₹)</Label>
              <Input
                type="number"
                placeholder="0"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="h-11 rounded-xl text-sm font-black"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Status Update</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full h-11 px-3 border border-gray-200 rounded-xl bg-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="in_progress">In Progress (Investigating)</option>
                <option value="resolved">Resolved (Complete)</option>
                <option value="closed">Closed (No Action)</option>
              </select>
            </div>
          </div>

          {/* Resolution Message */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-gray-700">Resolution Note to User *</Label>
            <Textarea
              placeholder="State the decision and steps taken to resolve this problem..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="rounded-xl min-h-[90px] text-xs font-medium"
            />
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-white shrink-0 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-12 px-6 rounded-xl border-gray-200 text-xs font-bold uppercase tracking-wider"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleApplyResolution}
            className="flex-1 h-12 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-wider rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Dispatching Resolution...
              </>
            ) : (
              <>
                Apply Resolution & Notify User <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
