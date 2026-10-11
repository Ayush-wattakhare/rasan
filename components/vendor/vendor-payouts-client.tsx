'use client';

import { useState } from 'react';
import { 
  IndianRupee, 
  TrendingUp, 
  Package, 
  Calendar, 
  ArrowUpRight, 
  Zap, 
  Smartphone, 
  Landmark, 
  CheckCircle2, 
  Settings2,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RedeemModal } from '@/components/payouts/redeem-modal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/lib/hooks/use-toast';

interface VendorPayoutsClientProps {
  stats: Array<{ label: string; gross: number; fee: number; net: number; count: number }>;
  allOrders: any[];
  vendor: any;
  platformFeePct: number;
  /** Sum of payouts already requested (pending or completed). */
  requestedPayouts?: number;
}

export function VendorPayoutsClient({
  stats,
  allOrders,
  vendor,
  platformFeePct,
  requestedPayouts = 0,
}: VendorPayoutsClientProps) {
  const { toast } = useToast();
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isSavingBank, setIsSavingBank] = useState(false);

  const [bankForm, setBankForm] = useState({
    upiId: vendor.bank_details?.upi_id || '',
    accountNumber: vendor.bank_details?.account_number || '',
    ifscCode: vendor.bank_details?.ifsc_code || '',
    accountName: vendor.bank_details?.account_holder_name || '',
    bankName: vendor.bank_details?.bank_name || '',
    preferredPayout: vendor.bank_details?.preferred_payout_method || 'upi',
  });

  const allTimeNet = stats[3]?.net || 0;
  const [availableBalance, setAvailableBalance] = useState<number>(
    Math.max(0, allTimeNet - requestedPayouts)
  );

  const handleSaveBankDetails = async () => {
    setIsSavingBank(true);
    try {
      const res = await fetch('/api/vendor/bank-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankDetails: {
            upi_id: bankForm.upiId.trim(),
            account_number: bankForm.accountNumber.trim(),
            ifsc_code: bankForm.ifscCode.trim().toUpperCase(),
            account_holder_name: bankForm.accountName.trim(),
            bank_name: bankForm.bankName.trim(),
            preferred_payout_method: bankForm.preferredPayout,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update bank details');
      }

      toast({
        title: 'Financial Node Synced',
        description: 'Your UPI ID and Bank Account details have been successfully updated.',
      });
      setIsBankModalOpen(false);
    } catch (err: any) {
      toast({
        title: 'Update Failed',
        description: err.message || 'Could not save bank details.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingBank(false);
    }
  };

  const hasPayoutMethod = bankForm.upiId || bankForm.accountNumber;

  return (
    <>
      <RedeemModal
        isOpen={isRedeemOpen}
        onClose={() => setIsRedeemOpen(false)}
        availableBalance={availableBalance}
        userRole="vendor"
        initialBankDetails={{
          account_number: bankForm.accountNumber,
          ifsc_code: bankForm.ifscCode,
          account_holder_name: bankForm.accountName,
          bank_name: bankForm.bankName,
          upi_id: bankForm.upiId,
          preferred_payout_method: bankForm.preferredPayout as any,
        }}
        onSuccess={(withdrawnAmt) => {
          setAvailableBalance((prev) => Math.max(0, prev - withdrawnAmt));
        }}
      />

      {/* Edit Bank & UPI Details Dialog */}
      <Dialog open={isBankModalOpen} onOpenChange={setIsBankModalOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white">
          <div className="bg-[#1A1A1A] p-6 sm:p-8 text-white relative">
            <DialogHeader className="space-y-2 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-orange-400 text-[0.6rem] font-black uppercase tracking-widest w-fit">
                <ShieldCheck className="w-3.5 h-3.5" /> Payout Gateway Configuration
              </div>
              <DialogTitle className="text-2xl font-black uppercase italic tracking-tight text-white">
                Bank & <span className="text-orange-500">UPI Setup</span>
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-xs font-semibold">
                Set your preferred payout account to receive sales proceeds automatically or on demand.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* UPI ID */}
            <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-100 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-widest text-orange-950 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-orange-600" />
                  Instant UPI ID (Recommended)
                </Label>
                <span className="text-[0.6rem] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                  ⚡ 1-Min Payout
                </span>
              </div>
              <Input
                placeholder="e.g. anitaskitchen@okhdfcbank or 9876543210@paytm"
                value={bankForm.upiId}
                onChange={(e) => setBankForm({ ...bankForm, upiId: e.target.value })}
                className="bg-white border-gray-200 h-12 rounded-xl font-mono text-xs font-bold"
              />
              <p className="text-[0.65rem] text-gray-500">
                Supports GPay, PhonePe, Paytm, BHIM, and all UPI applications.
              </p>
            </div>

            {/* Direct Bank Account */}
            <div className="space-y-4">
              <Label className="text-xs font-black uppercase tracking-widest text-gray-700 flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-gray-500" />
                Direct Bank Account (IMPS / NEFT)
              </Label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-[0.65rem] font-bold text-gray-600">Account Holder Name</Label>
                  <Input
                    placeholder="Name as per Bank Record"
                    value={bankForm.accountName}
                    onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                    className="h-10 rounded-xl text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[0.65rem] font-bold text-gray-600">Bank Name</Label>
                  <Input
                    placeholder="e.g. HDFC Bank"
                    value={bankForm.bankName}
                    onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                    className="h-10 rounded-xl text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[0.65rem] font-bold text-gray-600">IFSC Code</Label>
                  <Input
                    placeholder="e.g. HDFC0001234"
                    value={bankForm.ifscCode}
                    onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                    className="h-10 rounded-xl text-xs font-bold uppercase font-mono"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-[0.65rem] font-bold text-gray-600">Account Number</Label>
                  <Input
                    placeholder="Bank Account Number"
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                    className="h-10 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsBankModalOpen(false)}
                className="flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-widest"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveBankDetails}
                disabled={isSavingBank}
                className="flex-1 h-12 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest rounded-xl text-xs"
              >
                {isSavingBank ? 'Saving...' : 'Save Payout Details'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-8">
        {/* Top Payout Action Card */}
        <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-xl border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[0.6rem] font-black uppercase tracking-widest text-orange-600 block">
              Available Kitchen Yield
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight italic">
                ₹{availableBalance.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-bold text-green-600 uppercase bg-green-50 px-2.5 py-1 rounded-full">
                ● Net Ready to Transfer
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium pt-1">
              {bankForm.upiId ? (
                <span className="flex items-center gap-1.5 text-gray-800">
                  <Smartphone className="w-3.5 h-3.5 text-orange-600" />
                  Linked UPI: <strong className="font-mono">{bankForm.upiId}</strong>
                </span>
              ) : null}
              {bankForm.accountNumber ? (
                <span className="flex items-center gap-1.5 text-gray-800">
                  <Landmark className="w-3.5 h-3.5 text-blue-600" />
                  Bank: •••• {bankForm.accountNumber.slice(-4)} {bankForm.ifscCode ? `(${bankForm.ifscCode})` : ''}
                </span>
              ) : null}
              {!hasPayoutMethod && (
                <span className="text-amber-600 font-bold">
                  ⚠️ No bank or UPI details added yet
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              onClick={() => setIsRedeemOpen(true)}
              className="flex-1 md:flex-initial h-14 px-8 bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4" /> Instant Payout / Redeem
            </Button>
            <Button
              onClick={() => setIsBankModalOpen(true)}
              variant="outline"
              className="h-14 px-5 border-gray-200 text-gray-700 font-black uppercase tracking-widest rounded-2xl text-xs hover:bg-gray-50 flex items-center gap-2"
            >
              <Settings2 className="w-4 h-4" />
              Configure UPI / Bank
            </Button>
          </div>
        </div>

        {/* Earnings Period Breakdown Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">{stat.label}</span>
                <TrendingUp className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900 tracking-tight">₹{stat.net.toFixed(0)}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Net (90%)</p>
              </div>
              <div className="pt-3 border-t border-gray-100 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Gross</span>
                  <span className="font-bold text-gray-700">₹{stat.gross.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Platform (10%)</span>
                  <span className="font-bold text-red-400">-₹{stat.fee.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Orders</span>
                  <span className="font-bold text-gray-700">{stat.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-black text-gray-900 uppercase italic tracking-tighter">Kitchen Settlement Ledger</h2>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {allOrders.length} Completed Orders
            </span>
          </div>

          {allOrders.length === 0 ? (
            <div className="p-20 text-center">
              <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="font-black text-gray-400 uppercase text-sm italic">No delivered orders yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {allOrders.slice(0, 30).map((order) => {
                const net = (order.total || 0) * (1 - platformFeePct);
                return (
                  <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-orange-50/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-gray-900 uppercase">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-[0.6rem] text-gray-400 font-medium">
                          {new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-green-600">+₹{net.toFixed(0)}</p>
                      <p className="text-[0.6rem] text-gray-400">Gross ₹{(order.total || 0).toFixed(0)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
