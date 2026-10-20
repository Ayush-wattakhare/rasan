'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  IndianRupee,
  Search,
  Plus,
  User,
  ChefHat,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/lib/hooks/use-toast';
import type { RefundRecord } from '@/lib/payments/refund-types';
import { formatDistanceToNow } from 'date-fns';

type Role = 'customer' | 'vendor' | 'delivery';
type PartnerOption = { id: string; name: string | null; email: string | null; phone: string | null };

const TYPE_FOR_ROLE: Record<Role, RefundRecord['type']> = {
  customer: 'customer_refund',
  vendor: 'vendor_compensation',
  delivery: 'rider_waiting_fee',
};

const emptyForm = {
  orderId: '',
  recipientRole: 'customer' as Role,
  recipientId: '',
  amount: '',
  reason: '',
  gateway: 'bank_transfer',
};

function newKey() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const STATUS_STYLE: Record<RefundRecord['status'], string> = {
  processed: 'text-green-700 bg-green-50',
  pending: 'text-amber-700 bg-amber-50',
  failed: 'text-red-700 bg-red-50',
};

export function RefundsClient() {
  const { toast } = useToast();
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [summary, setSummary] = useState({ totalRefunded: 0, customerRefunded: 0, partnerPaid: 0, needsAttention: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [idempotencyKey, setIdempotencyKey] = useState(newKey);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [partnerQuery, setPartnerQuery] = useState('');
  const [busyRef, setBusyRef] = useState<string | null>(null);

  const fetchRefunds = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/admin/refunds');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load the ledger');
      setRefunds(data.refunds || []);
      setSummary({
        totalRefunded: data.totalRefunded || 0,
        customerRefunded: data.customerRefunded || 0,
        partnerPaid: data.partnerPaid || 0,
        needsAttention: data.needsAttention || 0,
      });
    } catch (err: any) {
      setLoadError(err.message || 'Could not load the ledger');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  // Partner picker for vendor / rider compensation.
  useEffect(() => {
    if (!isModalOpen || form.recipientRole === 'customer') return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ role: form.recipientRole });
        if (partnerQuery.trim()) params.set('q', partnerQuery.trim());
        const res = await fetch(`/api/admin/users?${params}`, { signal: controller.signal });
        const data = await res.json();
        if (res.ok) setPartners(data.users || []);
      } catch {
        // aborted or offline
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isModalOpen, form.recipientRole, partnerQuery]);

  const openModal = () => {
    setForm(emptyForm);
    setPartnerQuery('');
    setIdempotencyKey(newKey());
    setIsModalOpen(true);
  };

  const handleCreateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: form.orderId.trim() || undefined,
          recipientId: form.recipientRole === 'customer' ? undefined : form.recipientId,
          amount: Number(form.amount),
          type: TYPE_FOR_ROLE[form.recipientRole],
          reason: form.reason,
          gateway: form.gateway,
          idempotencyKey,
        }),
      });
      const data = await res.json();
      if (!res.ok && !data.queued) throw new Error(data.error || 'Failed to process');

      toast({
        title: data.queued ? 'Refund Queued' : form.recipientRole === 'customer' ? 'Refund Sent' : 'Payment Recorded',
        description: data.message || data.error,
      });
      setIsModalOpen(false);
      fetchRefunds();
    } catch (err: any) {
      toast({ title: 'Could not process', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const runAction = async (r: RefundRecord, action: 'retry' | 'mark_processed') => {
    let utr: string | undefined;
    if (action === 'mark_processed') {
      const entered = window.prompt('Bank / UPI reference (UTR) of the payment you made:');
      if (!entered) return;
      utr = entered.trim();
    }
    setBusyRef(r.reference_id);
    try {
      const res = await fetch('/api/admin/refunds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceId: r.reference_id, action, utr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      toast({ title: 'Updated', description: data.message });
      fetchRefunds();
    } catch (err: any) {
      toast({ title: 'Action failed', description: err.message, variant: 'destructive' });
    } finally {
      setBusyRef(null);
    }
  };

  const filteredRefunds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return refunds;
    return refunds.filter((r) =>
      [r.reference_id, r.recipient_name, r.reason, r.order_id, r.order_number]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [refunds, searchQuery]);

  const isCustomer = form.recipientRole === 'customer';

  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg w-full p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white max-h-[90vh] flex flex-col my-auto">
          <div className="bg-[#1A1A1A] px-6 sm:px-8 py-5 text-white relative shrink-0">
            <div className="relative z-10 space-y-1">
              <span className="px-2.5 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[0.6rem] font-black uppercase tracking-wider">
                Refunds & Compensation
              </span>
              <DialogTitle className="text-xl font-black uppercase italic tracking-tight text-white leading-tight">
                New Refund / Payment
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-xs font-semibold">
                Customer refunds go back through Razorpay. Partner payments are recorded and paid by finance.
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={handleCreateRefund} className="flex-1 flex flex-col min-h-0">
            <div className="p-6 sm:p-8 space-y-4 overflow-y-auto flex-1">
              <div className="space-y-1">
                <Label htmlFor="refund-role" className="text-[0.65rem] font-bold text-gray-600">Who receives the money</Label>
                <select
                  id="refund-role"
                  value={form.recipientRole}
                  onChange={(e) => setForm({ ...form, recipientRole: e.target.value as Role, recipientId: '' })}
                  className="w-full h-11 px-3 border border-gray-200 rounded-xl bg-white text-xs font-bold"
                >
                  <option value="customer">Customer (refund an order)</option>
                  <option value="vendor">Home Chef (compensation)</option>
                  <option value="delivery">Delivery Rider (waiting fee)</option>
                </select>
              </div>

              {isCustomer ? (
                <div className="space-y-1">
                  <Label htmlFor="refund-order" className="text-[0.65rem] font-bold text-gray-600">Order number or ID *</Label>
                  <Input
                    id="refund-order"
                    required
                    placeholder="e.g. ORD-20261019-000123"
                    value={form.orderId}
                    onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                    className="h-11 rounded-xl text-xs font-mono"
                  />
                  <p className="text-[0.6rem] text-gray-400">Sent to the customer&apos;s original payment method. Capped at what is still refundable.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="partner-search" className="text-[0.65rem] font-bold text-gray-600">Find partner *</Label>
                    <Input
                      id="partner-search"
                      placeholder="Name, email or phone"
                      value={partnerQuery}
                      onChange={(e) => setPartnerQuery(e.target.value)}
                      className="h-11 rounded-xl text-xs"
                    />
                    <select
                      aria-label="Partner"
                      required
                      value={form.recipientId}
                      onChange={(e) => setForm({ ...form, recipientId: e.target.value })}
                      className="w-full h-11 px-3 border border-gray-200 rounded-xl bg-white text-xs font-bold"
                    >
                      <option value="">Select…</option>
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name || 'Unnamed'} · {p.phone || p.email || p.id.slice(0, 8)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="refund-order-opt" className="text-[0.65rem] font-bold text-gray-600">Related order (optional)</Label>
                    <Input
                      id="refund-order-opt"
                      placeholder="Order number"
                      value={form.orderId}
                      onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                      className="h-11 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="refund-gateway" className="text-[0.65rem] font-bold text-gray-600">Paid via</Label>
                    <select
                      id="refund-gateway"
                      value={form.gateway}
                      onChange={(e) => setForm({ ...form, gateway: e.target.value })}
                      className="w-full h-11 px-3 border border-gray-200 rounded-xl bg-white text-xs font-bold"
                    >
                      <option value="bank_transfer">Bank transfer (IMPS / NEFT)</option>
                      <option value="upi">UPI</option>
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <Label htmlFor="refund-amount" className="text-[0.65rem] font-bold text-gray-600">Amount (₹) *</Label>
                <Input
                  id="refund-amount"
                  required
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="h-11 rounded-xl text-sm font-black text-green-600"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="refund-reason" className="text-[0.65rem] font-bold text-gray-600">Reason *</Label>
                <Input
                  id="refund-reason"
                  required
                  maxLength={500}
                  placeholder="e.g. Missing sweet dish / Rider waited 20 minutes"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="h-11 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-white flex gap-3 shrink-0">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="h-11 rounded-xl text-xs font-bold uppercase">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-11 bg-green-600 hover:bg-green-500 text-white font-black text-xs uppercase rounded-xl shadow-lg"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isCustomer ? 'Send Refund' : 'Record Payment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[0.6rem] font-black uppercase tracking-widest">Total Paid Out</span>
              <IndianRupee className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-3xl font-black text-gray-900 tracking-tight italic">
              ₹{summary.totalRefunded.toLocaleString('en-IN')}
            </div>
            <p className="text-[0.65rem] text-gray-500 font-bold uppercase">Processed entries only</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[0.6rem] font-black uppercase tracking-widest">Customer Refunds</span>
              <User className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-3xl font-black text-orange-600 tracking-tight italic">
              ₹{summary.customerRefunded.toLocaleString('en-IN')}
            </div>
            <p className="text-[0.65rem] text-gray-500 font-bold uppercase">
              Partner payments ₹{summary.partnerPaid.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[0.6rem] font-black uppercase tracking-widest">Needs Attention</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-3xl font-black text-amber-600 tracking-tight italic">{summary.needsAttention}</div>
            <p className="text-[0.65rem] text-gray-500 font-bold uppercase">Pending or failed entries</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
            <Input
              aria-label="Search the ledger"
              placeholder="Search reference, name, reason, order…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 rounded-xl text-xs font-semibold"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={openModal}
              className="h-11 px-5 bg-green-600 hover:bg-green-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> New Refund / Payment
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Refresh"
              onClick={fetchRefunds}
              className="h-11 w-11 rounded-xl border-gray-200"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-black uppercase italic tracking-tight text-gray-900">Ledger</h3>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{filteredRefunds.length} Records</span>
          </div>

          {loadError ? (
            <p className="p-8 text-center text-sm font-semibold text-red-600">{loadError}</p>
          ) : !isLoading && filteredRefunds.length === 0 ? (
            <p className="p-8 text-center text-sm font-semibold text-gray-400">No refunds or payments yet.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredRefunds.map((r) => (
                <div key={r.id} className="p-5 hover:bg-gray-50/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
                        {r.reference_id}
                      </span>
                      <span className={`text-[0.6rem] font-black uppercase px-2 py-0.5 rounded-full ${
                        r.recipient_role === 'customer' ? 'bg-orange-100 text-orange-700' :
                        r.recipient_role === 'vendor' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {r.recipient_role === 'vendor' ? <ChefHat className="inline w-3 h-3 mr-0.5" aria-hidden="true" /> : null}
                        {r.recipient_role}
                      </span>
                      <span className="text-[0.6rem] font-bold text-gray-400 uppercase font-mono">Via {r.gateway.replace('_', ' ')}</span>
                    </div>

                    <p className="text-xs font-bold text-gray-900">
                      {r.recipient_name} • <span className="text-gray-500 font-medium">{r.reason}</span>
                    </p>
                    {r.failure_reason && r.status === 'failed' && (
                      <p className="text-[0.65rem] font-semibold text-red-600">{r.failure_reason}</p>
                    )}

                    <div className="text-[0.65rem] text-gray-400 font-medium">
                      {r.order_number || r.order_id ? `Order #${r.order_number || r.order_id?.slice(0, 8)} • ` : ''}
                      {formatDistanceToNow(new Date(r.processed_at || r.created_at), { addSuffix: true })}
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-1.5">
                    <div className="text-lg font-black text-green-600 tracking-tight">₹{Number(r.amount).toFixed(2)}</div>
                    <span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_STYLE[r.status]}`}>
                      {r.status}
                    </span>
                    <div className="flex gap-2 justify-end">
                      {r.status === 'failed' && r.type === 'customer_refund' && (
                        <Button size="sm" variant="outline" disabled={busyRef === r.reference_id} onClick={() => runAction(r, 'retry')} className="h-7 text-[0.6rem] font-black uppercase rounded-lg">
                          Retry
                        </Button>
                      )}
                      {r.status !== 'processed' && !r.gateway_refund_id && (
                        <Button size="sm" variant="outline" disabled={busyRef === r.reference_id} onClick={() => runAction(r, 'mark_processed')} className="h-7 text-[0.6rem] font-black uppercase rounded-lg">
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
