'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/lib/hooks/use-toast';
import { RedeemModal } from '@/components/payouts/redeem-modal';
import {
  Wallet,
  Landmark,
  Phone,
  User,
  ShieldCheck,
  Zap,
  Save,
  Truck,
  ArrowRightCircle,
  Smartphone,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function OperatorProfileMain({ profile, deliveryPartner }: any) {
  const [formData, setFormData] = useState({
    name: profile.name || '',
    phone: profile.phone || '',
    upiId: deliveryPartner.bank_details?.upi_id || '',
    accountNumber: deliveryPartner.bank_details?.account_number || '',
    ifscCode: deliveryPartner.bank_details?.ifsc_code || '',
    accountName: deliveryPartner.bank_details?.account_holder_name || '',
    bankName: deliveryPartner.bank_details?.bank_name || '',
    preferredPayout: deliveryPartner.bank_details?.preferred_payout_method || 'upi',
  });

  const [availableYield, setAvailableYield] = useState<number>(
    deliveryPartner.earnings?.total || 1450
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // 1. Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name: formData.name.trim(), phone: formData.phone.trim() })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // 2. Update bank details & UPI ID via API
      const bankDetails = {
        upi_id: formData.upiId.trim(),
        account_number: formData.accountNumber.trim(),
        ifsc_code: formData.ifscCode.trim().toUpperCase(),
        account_holder_name: formData.accountName.trim(),
        bank_name: formData.bankName.trim(),
        preferred_payout_method: formData.preferredPayout as 'upi' | 'bank',
      };

      const res = await fetch('/api/delivery/bank-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankDetails }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update financial details');
      }

      toast({
        title: 'Configurations Synced',
        description: 'Identity credentials, UPI ID, and Bank details saved successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Sync Failed',
        description: error.message || 'Could not update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePayoutSuccess = (withdrawnAmount: number) => {
    setAvailableYield((prev) => Math.max(0, prev - withdrawnAmount));
  };

  return (
    <>
      <RedeemModal
        isOpen={isRedeemOpen}
        onClose={() => setIsRedeemOpen(false)}
        availableBalance={availableYield}
        userRole="delivery"
        initialBankDetails={{
          account_number: formData.accountNumber,
          ifsc_code: formData.ifscCode,
          account_holder_name: formData.accountName,
          bank_name: formData.bankName,
          upi_id: formData.upiId,
          preferred_payout_method: formData.preferredPayout as any,
        }}
        onSuccess={handlePayoutSuccess}
      />

      <div className="min-h-screen bg-[#FAFAF9] pb-40">
        {/* ── MISSION HERO HEADER ── */}
        <section className="bg-[#1A1A1A] py-12 md:py-16 px-4 md:px-8 relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px] -mr-32 -mt-32 pointer-events-none" />
          <div className="container mx-auto relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-orange-400 text-[0.6rem] font-black uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" /> Pilot Node Settings
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase italic leading-none">
              OPERATOR <span className="text-orange-500">CONFIG & PAYOUTS</span>
            </h1>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
              Manage identity credentials, instant UPI payouts, and direct bank settlement nodes
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 md:px-8 -mt-8 relative z-20 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
            
            {/* Main Config Column (2 Cols) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Identity Card */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 space-y-6">
                <div className="flex items-center gap-3.5 border-b border-gray-100 pb-5">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 font-black">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 uppercase italic tracking-tight">Identity Node</h3>
                    <p className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest">Core Rider Information</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest pl-1">Operator Alias / Name</Label>
                    <Input 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="bg-gray-50 border-gray-100 h-12 rounded-xl font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest pl-1">Comm Link (Phone)</Label>
                    <Input 
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="bg-gray-50 border-gray-100 h-12 rounded-xl font-bold text-sm"
                      placeholder="+91..."
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest pl-1">Assigned Transport Unit</Label>
                    <div className="bg-gray-50 h-12 rounded-xl px-4 flex items-center justify-between text-gray-700 font-bold border border-gray-100 text-xs">
                      <div className="flex items-center gap-2.5">
                         <Truck className="w-4 h-4 text-orange-600" />
                         <span className="uppercase">{deliveryPartner.vehicle_type || 'Motorcycle / Scooter'}</span>
                      </div>
                      <span className="font-mono text-gray-900 font-black">{deliveryPartner.vehicle_number || 'MH 14 DA 2024'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial & UPI Details Card */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 font-black">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 uppercase italic tracking-tight">Payout Gateway</h3>
                      <p className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest">Instant UPI ID & Bank Account</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-[0.6rem] font-black uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ready
                  </span>
                </div>

                {/* Section 1: Instant UPI ID */}
                <div className="p-4 sm:p-5 rounded-2xl bg-orange-50/60 border border-orange-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-orange-600" />
                      <span className="text-xs font-black uppercase tracking-wider text-orange-950">
                        Instant UPI ID (Recommended)
                      </span>
                    </div>
                    <span className="text-[0.6rem] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                      ⚡ 1-Minute Transfer
                    </span>
                  </div>
                  <Input
                    name="upiId"
                    value={formData.upiId}
                    onChange={handleInputChange}
                    placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                    className="bg-white border-gray-200 h-12 rounded-xl px-4 font-mono text-xs font-bold text-gray-900 focus:border-orange-500"
                  />
                  <p className="text-[0.65rem] text-gray-500">
                    Supports Google Pay, PhonePe, Paytm, BHIM, and bank UPI apps.
                  </p>
                </div>

                {/* Section 2: Direct Bank Account */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-gray-800">
                      Direct Bank Account (IMPS / NEFT)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest pl-1">Account Holder Name</Label>
                      <Input 
                        name="accountName"
                        value={formData.accountName}
                        onChange={handleInputChange}
                        placeholder="Name as printed in Passbook"
                        className="bg-gray-50 border-gray-100 h-11 rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest pl-1">Bank Name</Label>
                      <Input 
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleInputChange}
                        placeholder="e.g. HDFC Bank / SBI"
                        className="bg-gray-50 border-gray-100 h-11 rounded-xl text-xs font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest pl-1">IFSC Routing Code</Label>
                      <Input 
                        name="ifscCode"
                        value={formData.ifscCode}
                        onChange={handleInputChange}
                        placeholder="e.g. HDFC0001234"
                        className="bg-gray-50 border-gray-100 h-11 rounded-xl text-xs font-bold uppercase font-mono"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest pl-1">Bank Account Number</Label>
                      <Input 
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleInputChange}
                        placeholder="Account Number"
                        className="bg-gray-50 border-gray-100 h-11 rounded-xl text-xs font-bold font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <Button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full h-14 rounded-2xl bg-[#1A1A1A] hover:bg-orange-600 text-white font-black uppercase tracking-widest shadow-xl transition-all cursor-pointer text-xs"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2"><Zap className="w-4 h-4 animate-pulse" /> Syncing Node Configurations...</span>
                ) : (
                  <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Save Financial & Profile Config</span>
                )}
              </Button>
            </div>

            {/* Earnings / Instant Cashout Side Column (1 Col) */}
            <div className="space-y-6">
              <div className="bg-[#1A1A1A] text-white rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 rounded-full blur-[60px]" />
                
                <div className="space-y-1 relative z-10">
                  <div className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-green-400" />
                    Available Yield to Redeem
                  </div>
                  <div className="text-3xl sm:text-4xl font-black italic tracking-tight uppercase text-green-400 pt-1 break-words">
                    ₹{availableYield.toLocaleString('en-IN')}
                  </div>
                  <p className="text-[0.65rem] text-gray-400 font-semibold">
                    Instant payout to UPI or Bank with zero fees.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2.5 text-xs">
                   <div className="flex justify-between items-center font-bold text-gray-300">
                      <span>Today's Orbital Yield</span>
                      <span className="text-white font-black">₹{deliveryPartner.earnings?.today || 180}</span>
                   </div>
                   <div className="flex justify-between items-center font-bold text-gray-300">
                      <span>Weekly Run Rate</span>
                      <span className="text-white font-black">₹{deliveryPartner.earnings?.this_week || 850}</span>
                   </div>
                   <div className="flex justify-between items-center font-bold text-gray-300 border-t border-white/5 pt-2">
                      <span>Payout Target</span>
                      <span className="text-orange-400 font-mono text-xs font-black truncate max-w-[130px]">
                        {formData.upiId || (formData.accountNumber ? `•••• ${formData.accountNumber.slice(-4)}` : 'Not Linked')}
                      </span>
                   </div>
                </div>

                <Button 
                  onClick={() => setIsRedeemOpen(true)}
                  className="w-full bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest h-13 rounded-2xl transition-all flex items-center justify-between px-5 shadow-xl text-xs cursor-pointer"
                >
                  <span>Redeem / Cash Out</span>
                  <ArrowRightCircle className="w-4 h-4" />
                </Button>
              </div>

              {/* Payment Security Notice */}
              <div className="bg-orange-50/70 border border-orange-100 rounded-3xl p-6 text-center space-y-3">
                <ShieldCheck className="w-8 h-8 text-orange-600 mx-auto" />
                <h4 className="font-black text-gray-900 uppercase italic tracking-tight text-base">Payment Security</h4>
                <p className="text-xs text-gray-600 font-medium">
                  Payouts are encrypted and transferred directly via NPCI UPI & RBI IMPS rails.
                </p>
                <div className="pt-1 flex justify-center items-center gap-2 text-[0.6rem] font-black text-gray-500 uppercase">
                  <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-gray-400" /> 256-Bit SSL</span>
                  <span>•</span>
                  <span>⚡ Instant IMPS</span>
                  <span>•</span>
                  <span>🇮🇳 UPI 2.0</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
