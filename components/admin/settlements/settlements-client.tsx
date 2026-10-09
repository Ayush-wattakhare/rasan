'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  IndianRupee,
  Search,
  CheckCircle2,
  Clock,
  Landmark,
  Smartphone,
  ShieldCheck,
  CreditCard,
  ChefHat,
  Truck,
  ArrowRight,
  Filter,
  Check,
  Zap,
  TrendingUp,
  Percent,
  Receipt,
  FileCheck,
  AlertCircle,
  Copy,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/lib/hooks/use-toast';
import { RASAN_COMMISSION_PERCENTAGE } from '@/lib/utils/constants';
import type { SettlementRecord } from '@/app/api/admin/settlements/route';
import { formatDistanceToNow, format } from 'date-fns';

export function SettlementsClient() {
  const { toast } = useToast();
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);
  const [metrics, setMetrics] = useState<any>({
    totalSettledAmount: 0,
    totalPendingAmount: 0,
    totalCommissionEarned: 0,
    totalGrossGMV: 0,
    commissionRatePercentage: RASAN_COMMISSION_PERCENTAGE,
    pendingApprovalsCount: 0,
    settledTransfersCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'vendor' | 'delivery' | 'settled'>('pending');
  
  // Settle modal state
  const [selectedSettlement, setSelectedSettlement] = useState<SettlementRecord | null>(null);
  const [customUtr, setCustomUtr] = useState('');
  const [settleNotes, setSettleNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSettlements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/settlements');
      const data = await res.json();
      if (data.success) {
        setSettlements(data.settlements || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to fetch settlements', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const handleOpenSettleModal = (item: SettlementRecord) => {
    setSelectedSettlement(item);
    setCustomUtr(`UTR-${format(new Date(), 'yyyyMMdd')}-${Math.floor(10000 + Math.random() * 90000)}`);
    setSettleNotes(`Batch settlement approved for ${item.recipient_name}`);
  };

  const handleExecuteSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSettlement) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settlementId: selectedSettlement.id,
          customUtr: customUtr.trim(),
          notes: settleNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to settle payout');

      toast({
        title: 'Payout Dispatched & Settled! 💸',
        description: `₹${selectedSettlement.amount.toLocaleString('en-IN')} wired via ${selectedSettlement.payment_method.toUpperCase()}. Ref: ${customUtr}`,
      });

      setSelectedSettlement(null);
      fetchSettlements();
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: text,
    });
  };

  const filteredSettlements = useMemo(() => {
    return settlements.filter((item) => {
      // Tab filter
      if (selectedTab === 'pending' && item.status !== 'pending') return false;
      if (selectedTab === 'settled' && item.status !== 'settled') return false;
      if (selectedTab === 'vendor' && item.recipient_role !== 'vendor') return false;
      if (selectedTab === 'delivery' && item.recipient_role !== 'delivery') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.recipient_name.toLowerCase().includes(q);
        const matchesBiz = item.business_name?.toLowerCase().includes(q);
        const matchesUtr = item.utr_number.toLowerCase().includes(q);
        const matchesTarget = item.account_target.toLowerCase().includes(q);
        return matchesName || matchesBiz || matchesUtr || matchesTarget;
      }
      return true;
    });
  }, [settlements, selectedTab, searchQuery]);

  return (
    <div className="space-y-8">
      {/* ── METRICS RIBBON ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Platform Commission Tile */}
        <Card className="border-none shadow-xl bg-white rounded-3xl p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-orange-500" /> Platform Commission ({metrics.commissionRatePercentage}%)
              </div>
              <div className="text-3xl font-black text-gray-900 tracking-tighter italic">
                ₹{metrics.totalCommissionEarned.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[0.6rem] font-bold text-gray-400 uppercase tracking-wider mt-3">
            From ₹{metrics.totalGrossGMV.toLocaleString('en-IN')} Gross Tiffin Volume
          </div>
        </Card>

        {/* Pending Payouts Tile */}
        <Card className="border-none shadow-xl bg-white rounded-3xl p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[0.6rem] font-black text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" /> Pending Approvals
              </div>
              <div className="text-3xl font-black text-amber-600 tracking-tighter italic">
                ₹{metrics.totalPendingAmount.toLocaleString('en-IN')}
              </div>
            </div>
            <Badge className="bg-amber-100 text-amber-800 font-black text-xs px-2.5 py-1 rounded-full border border-amber-200">
              {metrics.pendingApprovalsCount} REQS
            </Badge>
          </div>
          <div className="text-[0.6rem] font-bold text-amber-600/80 uppercase tracking-wider mt-3">
            Awaiting Admin 1-Click Wire Clearance
          </div>
        </Card>

        {/* Total Settled Tile */}
        <Card className="border-none shadow-xl bg-white rounded-3xl p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[0.6rem] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Total Settled
              </div>
              <div className="text-3xl font-black text-gray-900 tracking-tighter italic">
                ₹{metrics.totalSettledAmount.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[0.6rem] font-bold text-emerald-600 uppercase tracking-wider mt-3">
            {metrics.settledTransfersCount} Dispatches Completed with Bank UTR
          </div>
        </Card>

        {/* Network Take-Rate Integrity */}
        <Card className="border-none shadow-xl bg-gradient-to-br from-gray-900 to-black text-white rounded-3xl p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-green-400" /> Financial Split Model
              </div>
              <div className="text-xl font-black text-white tracking-tight mt-1">
                93% Chef / 7% Rasan (Launch Tier)
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-green-400">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[0.6rem] font-bold text-gray-400 uppercase tracking-wider mt-3">
            Rider Bounties: 100% Payout Yield (₹0 Cut)
          </div>
        </Card>
      </div>

      {/* ── CONTROLS & FILTER TABS ── */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1.5 rounded-2xl overflow-x-auto">
            <button
              onClick={() => setSelectedTab('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                selectedTab === 'pending'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Pending ({metrics.pendingApprovalsCount})
            </button>
            <button
              onClick={() => setSelectedTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                selectedTab === 'all'
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Transfers
            </button>
            <button
              onClick={() => setSelectedTab('vendor')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedTab === 'vendor'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" /> Home Chefs
            </button>
            <button
              onClick={() => setSelectedTab('delivery')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedTab === 'delivery'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" /> Delivery Riders
            </button>
            <button
              onClick={() => setSelectedTab('settled')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedTab === 'settled'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Settled Audit Log
            </button>
          </div>

          {/* Search Input & Refresh */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chef, UTR, UPI..."
                className="pl-10 h-11 rounded-2xl bg-gray-50 border-gray-200 text-xs font-medium"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchSettlements}
              disabled={isLoading}
              className="h-11 w-11 rounded-2xl border-gray-200 hover:bg-gray-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* ── SETTLEMENTS TABLE ── */}
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-[0.65rem] font-black uppercase tracking-widest text-gray-400">
                <th className="py-4 px-5">Recipient / Partner</th>
                <th className="py-4 px-5">Financial Split</th>
                <th className="py-4 px-5">Payout Destination</th>
                <th className="py-4 px-5">Status & Timing</th>
                <th className="py-4 px-5 text-right">Settlement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredSettlements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                    No settlement records found for this filter.
                  </td>
                </tr>
              ) : (
                filteredSettlements.map((item) => {
                  const isPending = item.status === 'pending';
                  const isVendor = item.recipient_role === 'vendor';

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Recipient info */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                            isVendor ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {isVendor ? <ChefHat className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="font-black text-gray-900 text-sm flex items-center gap-2">
                              {item.recipient_name}
                              <Badge className={`text-[0.55rem] font-black uppercase tracking-wider border-none px-2 py-0.5 ${
                                isVendor ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {isVendor ? 'Home Chef' : 'Delivery Rider'}
                              </Badge>
                            </div>
                            <p className="text-[0.65rem] text-gray-500 font-medium">
                              {item.business_name || (isVendor ? 'Kitchen Partner' : 'Fleet Member')} • {item.notes || 'Weekly Payout'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Financial split */}
                      <td className="py-4 px-5">
                        <div>
                          <div className="font-black text-gray-900 text-base">
                            ₹{item.amount.toLocaleString('en-IN')}
                          </div>
                          {isVendor && item.platform_commission > 0 ? (
                            <div className="text-[0.6rem] text-gray-400 font-bold flex items-center gap-1 mt-0.5">
                              <span>Gross: ₹{item.gross_earnings}</span>
                              <span>•</span>
                              <span className="text-orange-600">Cut: -₹{item.platform_commission}</span>
                            </div>
                          ) : (
                            <div className="text-[0.6rem] text-green-600 font-bold mt-0.5">
                              100% Bounty Net (₹0 Fee)
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Destination */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          {item.payment_method === 'upi' ? (
                            <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Landmark className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                          <div>
                            <div className="font-bold text-gray-800 uppercase tracking-tight text-xs">
                              {item.payment_method.toUpperCase()}
                            </div>
                            <div className="font-mono text-[0.65rem] text-gray-500 font-semibold">
                              {item.account_target}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status & Timing */}
                      <td className="py-4 px-5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isPending ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                            <span className={`text-[0.65rem] font-black uppercase tracking-wider ${isPending ? 'text-amber-700' : 'text-emerald-700'}`}>
                              {isPending ? 'Pending Clearance' : 'Settled & Reconciled'}
                            </span>
                          </div>
                          <p className="text-[0.65rem] text-gray-400 font-medium mt-1">
                            {formatDistanceToNow(new Date(item.requested_at), { addSuffix: true })}
                          </p>
                          {!isPending && (
                            <button
                              onClick={() => copyToClipboard(item.utr_number)}
                              className="text-[0.6rem] font-mono text-gray-500 hover:text-gray-900 flex items-center gap-1 mt-1 font-bold cursor-pointer"
                              title="Click to copy UTR"
                            >
                              <span>{item.utr_number}</span>
                              <Copy className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-5 text-right">
                        {isPending ? (
                          <Button
                            onClick={() => handleOpenSettleModal(item)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider h-10 px-4 rounded-xl shadow-md flex items-center gap-1.5 ml-auto cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5" /> 1-Click Settle
                          </Button>
                        ) : (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-black text-[0.65rem] px-3 py-1.5 rounded-xl uppercase tracking-wider">
                            ✓ Transferred
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 1-CLICK SETTLEMENT MODAL ── */}
      <Dialog open={!!selectedSettlement} onOpenChange={(open) => !open && setSelectedSettlement(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white shadow-2xl border-none">
          <DialogHeader className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
              <Landmark className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-gray-900 uppercase italic tracking-tight">
              Authorize Wire Settlement
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 font-medium">
              Review platform commission split and approve immediate net payout dispatch.
            </DialogDescription>
          </DialogHeader>

          {selectedSettlement && (
            <form onSubmit={handleExecuteSettlement} className="space-y-5 pt-3">
              {/* Partner Summary Card */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5 border border-gray-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-bold uppercase tracking-wider text-[0.65rem]">Recipient</span>
                  <span className="font-black text-gray-900">{selectedSettlement.recipient_name}</span>
                </div>
                {selectedSettlement.business_name && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-bold uppercase tracking-wider text-[0.65rem]">Kitchen / Brand</span>
                    <span className="font-bold text-gray-800">{selectedSettlement.business_name}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-bold uppercase tracking-wider text-[0.65rem]">Destination</span>
                  <span className="font-mono font-bold text-emerald-700">{selectedSettlement.account_target}</span>
                </div>

                {/* Financial breakdown */}
                <div className="pt-2 border-t border-gray-200 space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Gross Volume</span>
                    <span>₹{selectedSettlement.gross_earnings.toLocaleString('en-IN')}</span>
                  </div>
                  {selectedSettlement.platform_commission > 0 && (
                    <div className="flex justify-between text-xs text-orange-600 font-medium">
                      <span>Rasan Platform Cut ({metrics.commissionRatePercentage}%)</span>
                      <span>-₹{selectedSettlement.platform_commission.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-gray-900 pt-1 border-t border-gray-200">
                    <span className="uppercase tracking-wider">Net Amount to Wire</span>
                    <span className="text-emerald-600 text-base">₹{selectedSettlement.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Bank UTR Reference */}
              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-black uppercase tracking-wider text-gray-500">
                  Bank Reference UTR / Transaction ID
                </label>
                <Input
                  required
                  value={customUtr}
                  onChange={(e) => setCustomUtr(e.target.value)}
                  placeholder="e.g. UTR-20261008-84291"
                  className="font-mono text-xs font-bold rounded-xl h-11"
                />
              </div>

              {/* Settlement Internal Notes */}
              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-black uppercase tracking-wider text-gray-500">
                  Settlement Notes / Memo
                </label>
                <Input
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  placeholder="Memo for recipient statement"
                  className="text-xs rounded-xl h-11"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedSettlement(null)}
                  className="flex-1 h-12 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Wire ₹{selectedSettlement.amount.toLocaleString('en-IN')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
