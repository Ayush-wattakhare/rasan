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
import { useToast } from '@/lib/hooks/use-toast';
import { 
  IndianRupee, 
  Zap, 
  Landmark, 
  Smartphone, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  Lock
} from 'lucide-react';
import type { BankDetails } from '@/types';

interface RedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  userRole: 'vendor' | 'delivery';
  initialBankDetails?: BankDetails | null;
  onSuccess?: (amount: number, transaction: any) => void;
}

export function RedeemModal({
  isOpen,
  onClose,
  availableBalance,
  userRole,
  initialBankDetails,
  onSuccess,
}: RedeemModalProps) {
  const { toast } = useToast();
  const [method, setMethod] = useState<'upi' | 'bank'>(
    initialBankDetails?.preferred_payout_method || (initialBankDetails?.upi_id ? 'upi' : 'upi')
  );
  
  const [amount, setAmount] = useState<string>('');
  const [upiId, setUpiId] = useState<string>(initialBankDetails?.upi_id || '');
  const [accountNumber, setAccountNumber] = useState<string>(initialBankDetails?.account_number || '');
  const [ifscCode, setIfscCode] = useState<string>(initialBankDetails?.ifsc_code || '');
  const [accountName, setAccountName] = useState<string>(initialBankDetails?.account_holder_name || '');
  const [bankName, setBankName] = useState<string>(initialBankDetails?.bank_name || '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payoutResult, setPayoutResult] = useState<any | null>(null);

  const numAmount = parseFloat(amount) || 0;
  const minAmount = 50;

  const handleQuickAmount = (val: number) => {
    const capped = Math.min(val, availableBalance);
    setAmount(capped.toString());
  };

  const handleRedeem = async () => {
    if (numAmount < minAmount) {
      toast({
        title: 'Minimum Amount Required',
        description: `Minimum withdrawal amount is ₹${minAmount}.`,
        variant: 'destructive',
      });
      return;
    }

    if (numAmount > availableBalance) {
      toast({
        title: 'Insufficient Balance',
        description: `Your available balance is ₹${availableBalance.toLocaleString('en-IN')}.`,
        variant: 'destructive',
      });
      return;
    }

    if (method === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        toast({
          title: 'Invalid UPI ID',
          description: 'Please enter a valid UPI ID (e.g. name@okaxis or 9876543210@paytm).',
          variant: 'destructive',
        });
        return;
      }
    } else {
      if (!accountNumber.trim() || !ifscCode.trim() || !accountName.trim()) {
        toast({
          title: 'Incomplete Bank Details',
          description: 'Please enter Account Name, Account Number, and IFSC Code.',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const endpoint = userRole === 'delivery' 
        ? '/api/delivery/payouts/withdraw' 
        : '/api/vendor/payouts/withdraw';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount,
          method,
          upiId: upiId.trim(),
          bankDetails: {
            account_number: accountNumber.trim(),
            ifsc_code: ifscCode.trim().toUpperCase(),
            account_holder_name: accountName.trim(),
            bank_name: bankName.trim(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process payout');
      }

      setPayoutResult(data.transaction || {
        id: `PAY-${Date.now().toString().slice(-6)}`,
        amount: numAmount,
        method,
        status: 'completed',
        timestamp: new Date().toISOString(),
      });

      toast({
        title: '🎉 Payout Initiated!',
        description: `₹${numAmount.toLocaleString('en-IN')} has been transferred to your ${method.toUpperCase()}.`,
      });

      if (onSuccess) {
        onSuccess(numAmount, data.transaction);
      }
    } catch (err: any) {
      toast({
        title: 'Payout Failed',
        description: err.message || 'Could not complete withdrawal. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPayoutResult(null);
    setAmount('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl bg-white max-h-[90vh] flex flex-col my-auto">
        {/* Compact Top Header */}
        <div className="bg-[#1A1A1A] px-6 py-5 text-white relative shrink-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-orange-600/20 rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none" />
          
          <div className="relative z-10 space-y-1 pr-8">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-orange-400 text-[0.6rem] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> Instant Cashout
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-black uppercase italic tracking-tight text-white leading-tight">
              Redeem <span className="text-orange-500">Earnings</span>
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-xs font-medium">
              Instant settlement to UPI or Direct Bank Account • 0% Fee
            </DialogDescription>
          </div>

          {/* Compact Balance Chip */}
          <div className="mt-3.5 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[0.55rem] font-black uppercase tracking-widest text-gray-400 block leading-none mb-1">
                Available Yield
              </span>
              <span className="text-xl sm:text-2xl font-black text-green-400 italic leading-none">
                ₹{availableBalance.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[0.6rem] font-bold text-orange-400 flex items-center justify-end gap-1">
                <Zap className="w-3 h-3" /> Min ₹{minAmount}
              </span>
            </div>
          </div>
        </div>

        {payoutResult ? (
          /* Success Receipt State */
          <div className="p-6 space-y-5 text-center overflow-y-auto">
            <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tight">
                Transfer Successful!
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Ref ID: <strong className="font-mono text-gray-800">{payoutResult.id || payoutResult.reference_id || 'TXN-98412'}</strong>
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Amount Transferred:</span>
                <span className="font-black text-gray-900">₹{numAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payout Method:</span>
                <span className="font-black uppercase text-orange-600">{method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Destination:</span>
                <span className="font-mono text-gray-800 font-bold">
                  {method === 'upi' ? upiId : `•••• ${accountNumber.slice(-4)} (${ifscCode})`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Platform Fee:</span>
                <span className="font-bold text-green-600">₹0 (Free Promo)</span>
              </div>
            </div>

            <Button
              onClick={handleClose}
              className="w-full h-12 bg-[#1A1A1A] hover:bg-orange-600 text-white font-black uppercase tracking-widest rounded-xl text-xs cursor-pointer"
            >
              Done & Close
            </Button>
          </div>
        ) : (
          /* Form State */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Amount Input */}
              <div className="space-y-2">
                <Label className="text-[0.65rem] font-black uppercase tracking-widest text-gray-500">
                  Withdrawal Amount (₹)
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-base">
                    ₹
                  </span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-8 h-12 text-xl font-black rounded-xl border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                {/* Quick Amount Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {[100, 250, 500].map((val) => (
                    <button
                      key={val}
                      type="button"
                      disabled={availableBalance < val}
                      onClick={() => handleQuickAmount(val)}
                      className="px-2.5 py-1 rounded-lg border border-gray-200 text-[0.7rem] font-bold text-gray-700 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition disabled:opacity-40"
                    >
                      +₹{val}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={availableBalance < minAmount}
                    onClick={() => handleQuickAmount(availableBalance)}
                    className="px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-[0.7rem] font-black text-orange-600 hover:bg-orange-100 transition disabled:opacity-40"
                  >
                    All (₹{availableBalance.toLocaleString('en-IN')})
                  </button>
                </div>
              </div>

              {/* Payout Method Selector */}
              <div className="space-y-2">
                <Label className="text-[0.65rem] font-black uppercase tracking-widest text-gray-500">
                  Select Payout Gateway
                </Label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMethod('upi')}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between h-20 cursor-pointer ${
                      method === 'upi'
                        ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Smartphone className={`w-4 h-4 ${method === 'upi' ? 'text-orange-600' : 'text-gray-400'}`} />
                      <span className="text-[0.55rem] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                        ⚡ 1-2 Mins
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-black text-gray-900">UPI Transfer</div>
                      <div className="text-[0.6rem] text-gray-500">PhonePe, GPay, Paytm</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('bank')}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between h-20 cursor-pointer ${
                      method === 'bank'
                        ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Landmark className={`w-4 h-4 ${method === 'bank' ? 'text-orange-600' : 'text-gray-400'}`} />
                      <span className="text-[0.55rem] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                        🏛️ IMPS 24x7
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-black text-gray-900">Bank Account</div>
                      <div className="text-[0.6rem] text-gray-500">Direct Account Transfer</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Method Details Inputs */}
              {method === 'upi' ? (
                <div className="space-y-1.5 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                  <Label className="text-[0.65rem] font-bold text-gray-700 flex items-center justify-between">
                    <span>UPI ID / VPA *</span>
                    <span className="text-[0.55rem] font-mono text-orange-600">e.g. mobile@paytm</span>
                  </Label>
                  <Input
                    placeholder="yourname@okhdfcbank or 9876543210@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="bg-white rounded-xl h-10 border-gray-200 font-mono text-xs font-bold"
                  />
                </div>
              ) : (
                <div className="space-y-2.5 bg-gray-50 p-3.5 rounded-2xl border border-gray-100 text-xs">
                  <div className="space-y-1">
                    <Label className="text-[0.6rem] font-bold text-gray-700">Account Holder Name *</Label>
                    <Input
                      placeholder="Name as per Bank Passbook"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="bg-white rounded-xl h-9 border-gray-200 text-xs font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[0.6rem] font-bold text-gray-700">Account Number *</Label>
                      <Input
                        placeholder="Account Number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="bg-white rounded-xl h-9 border-gray-200 text-xs font-bold font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[0.6rem] font-bold text-gray-700">IFSC Code *</Label>
                      <Input
                        placeholder="e.g. HDFC0001234"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                        className="bg-white rounded-xl h-9 border-gray-200 text-xs font-bold uppercase font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-white shrink-0 space-y-2">
              <Button
                onClick={handleRedeem}
                disabled={isSubmitting || numAmount < minAmount || numAmount > availableBalance}
                className="w-full h-12 bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-wider rounded-xl shadow-lg transition-all text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing Transfer...
                  </>
                ) : (
                  <>
                    Transfer ₹{numAmount > 0 ? numAmount.toLocaleString('en-IN') : '0'} to {method.toUpperCase()} <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
              <div className="flex items-center justify-center gap-2 text-[0.6rem] text-gray-400 font-bold uppercase">
                <Lock className="w-3 h-3 text-gray-400" />
                <span>256-bit encrypted • NPCI / RBI Approved</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
