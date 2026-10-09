'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  IndianRupee, 
  Search, 
  Plus, 
  CheckCircle2, 
  User, 
  ChefHat, 
  Truck, 
  Loader2, 
  ArrowRight,
  RefreshCw,
  Landmark,
  Smartphone,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/lib/hooks/use-toast';
import type { RefundRecord } from '@/app/api/admin/refunds/route';
import { formatDistanceToNow } from 'date-fns';

export function RefundsClient() {
  const { toast } = useToast();
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [totalRefunded, setTotalRefunded] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New settlement form
  const [form, setForm] = useState({
    orderId: '',
    recipientName: '',
    recipientRole: 'customer',
    recipientId: '',
    amount: '',
    type: 'customer_refund',
    reason: '',
    gateway: 'upi',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRefunds = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/refunds');
      const data = await res.json();
      if (data.success) {
        setRefunds(data.refunds || []);
        setTotalRefunded(data.totalRefunded || 0);
      }
    } catch (err) {
      console.error('Failed to load refunds', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const handleCreateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process refund');

      toast({
        title: 'Settlement Dispatched',
        description: `₹${form.amount} credited via ${form.gateway.toUpperCase()}.`,
      });

      setIsModalOpen(false);
      fetchRefunds();
      setForm({
        orderId: '',
        recipientName: '',
        recipientRole: 'customer',
        recipientId: '',
        amount: '',
        type: 'customer_refund',
        reason: '',
        gateway: 'upi',
      });
    } catch (err: any) {
      toast({
        title: 'Settlement Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRefunds = refunds.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.reference_id.toLowerCase().includes(q) ||
      r.recipient_name.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q) ||
      r.order_id.toLowerCase().includes(q)
    );
  });

  return (
    <>
      {/* Initiate Settlement Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg w-full p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white max-h-[90vh] flex flex-col my-auto">
          <div className="bg-[#1A1A1A] px-6 sm:px-8 py-5 text-white relative shrink-0">
            <div className="relative z-10 space-y-1">
              <span className="px-2.5 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[0.6rem] font-black uppercase tracking-wider">
                Financial Settlement Engine
              </span>
              <DialogTitle className="text-xl font-black uppercase italic tracking-tight text-white leading-tight">
                Initiate Instant Refund / Payout
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-xs font-semibold">
                Direct bank, UPI, or wallet credit to Customer, Home Chef, or Rider
              </DialogDescription>
            </div>
          </div>

          <form onSubmit={handleCreateRefund} className="flex-1 flex flex-col min-h-0">
            <div className="p-6 sm:p-8 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[0.65rem] font-bold text-gray-600">Beneficiary Role</Label>
                  <select
                    value={form.recipientRole}
                    onChange={(e) => {
                      const role = e.target.value;
                      setForm({
                        ...form,
                        recipientRole: role,
                        type: role === 'customer' ? 'customer_refund' : role === 'vendor' ? 'vendor_compensation' : 'rider_waiting_fee',
                      });
                    }}
                    className="w-full h-11 px-3 border border-gray-200 rounded-xl bg-white text-xs font-bold"
                  >
                    <option value="customer">Customer</option>
                    <option value="vendor">Home Chef (Vendor)</option>
                    <option value="delivery">Delivery Rider</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[0.65rem] font-bold text-gray-600">Settlement Gateway</Label>
                  <select
                    value={form.gateway}
                    onChange={(e) => setForm({ ...form, gateway: e.target.value })}
                    className="w-full h-11 px-3 border border-gray-200 rounded-xl bg-white text-xs font-bold"
                  >
                    <option value="upi">Instant UPI Transfer</option>
                    <option value="bank_transfer">Direct IMPS / NEFT</option>
                    <option value="razorpay">Razorpay Auto-Refund</option>
                    <option value="wallet">Rasan Wallet Balance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[0.65rem] font-bold text-gray-600">Beneficiary Name *</Label>
                  <Input
                    required
                    placeholder="e.g. John Doe"
                    value={form.recipientName}
                    onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                    className="h-11 rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[0.65rem] font-bold text-gray-600">Amount (₹) *</Label>
                  <Input
                    required
                    type="number"
                    placeholder="₹ 0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="h-11 rounded-xl text-xs font-black text-green-600 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[0.65rem] font-bold text-gray-600">Associated Order ID (Optional)</Label>
                <Input
                  placeholder="e.g. ORD-7518"
                  value={form.orderId}
                  onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                  className="h-11 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[0.65rem] font-bold text-gray-600">Reason / Settlement Note *</Label>
                <Input
                  required
                  placeholder="e.g. Missing Sweet Dish in meal / Wait time fee"
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
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Dispatch Settlement'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-8">
        {/* KPI Counter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[0.6rem] font-black uppercase tracking-widest">Total Disbursed Settlements</span>
              <IndianRupee className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-3xl font-black text-gray-900 tracking-tight italic">
              ₹{totalRefunded.toLocaleString('en-IN')}
            </div>
            <p className="text-[0.65rem] text-green-600 font-bold uppercase">● Real-time UPI & IMPS Rails</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[0.6rem] font-black uppercase tracking-widest">Customer Claims Paid</span>
              <User className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-3xl font-black text-orange-600 tracking-tight italic">
              ₹{refunds.filter(r => r.type === 'customer_refund').reduce((s, r) => s + r.amount, 0)}
            </div>
            <p className="text-[0.65rem] text-gray-500 font-bold uppercase">Food Quality & Delay Claims</p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[0.6rem] font-black uppercase tracking-widest">Partner Compensations</span>
              <ChefHat className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl font-black text-blue-600 tracking-tight italic">
              ₹{refunds.filter(r => r.type !== 'customer_refund').reduce((s, r) => s + r.amount, 0)}
            </div>
            <p className="text-[0.65rem] text-gray-500 font-bold uppercase">Wastage & Rider Waiting Fees</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search reference ID, beneficiary, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 rounded-xl text-xs font-semibold"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="h-11 px-5 bg-green-600 hover:bg-green-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Initiate Settlement
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchRefunds}
              className="h-11 w-11 rounded-xl border-gray-200"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Refunds Ledger Table */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-black uppercase italic tracking-tight text-gray-900">
              Settlement Ledger History
            </h3>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {filteredRefunds.length} Records
            </span>
          </div>

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
                      {r.recipient_role}
                    </span>
                    <span className="text-[0.6rem] font-bold text-gray-400 uppercase font-mono">
                      Via {r.gateway}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-gray-900">
                    {r.recipient_name} • <span className="text-gray-500 font-medium">{r.reason}</span>
                  </p>

                  <div className="text-[0.65rem] text-gray-400 font-medium">
                    Order Ref: #{r.order_id} • {formatDistanceToNow(new Date(r.processed_at), { addSuffix: true })}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-lg font-black text-green-600 tracking-tight">
                    +₹{r.amount.toFixed(0)}
                  </div>
                  <span className="text-[0.6rem] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full uppercase">
                    Processed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
