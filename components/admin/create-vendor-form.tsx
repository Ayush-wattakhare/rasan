'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Store, ShieldCheck, Landmark, Smartphone, Loader2, CheckCircle2 } from 'lucide-react';

interface CreateVendorFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateVendorForm({ onSuccess, onCancel }: CreateVendorFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    businessName: '',
    address: '',
    cuisine: '',
    fssai: '',
    gst: '',
    upiId: '',
    bankAccount: '',
    ifsc: '',
    accountName: '',
    bankName: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          role: 'vendor',
          bank_details: {
            upi_id: formData.upiId.trim(),
            account_number: formData.bankAccount.trim(),
            ifsc_code: formData.ifsc.trim().toUpperCase(),
            account_holder_name: formData.accountName.trim() || formData.name.trim(),
            bank_name: formData.bankName.trim(),
            preferred_payout_method: formData.upiId ? 'upi' : 'bank',
          },
        }),
      });

      const result = await response.json();

      if (response.ok) {
        onSuccess?.();
      } else {
        setError(result.error || 'Failed to create vendor');
      }
    } catch (err) {
      setError('An unexpected error occurred while creating the vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs font-bold">
          ⚠️ {error}
        </div>
      )}

      {/* 1. BASIC IDENTITY */}
      <div className="space-y-3 bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-100">
        <div className="flex items-center gap-2 border-b border-gray-200/60 pb-2">
          <Store className="w-4 h-4 text-orange-600" />
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
            Business & Kitchen Identity
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-[0.65rem] font-bold text-gray-600">Kitchen / Business Name *</Label>
            <Input
              placeholder="e.g. Grandma's Kitchen"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="h-10 rounded-xl text-xs font-bold bg-white"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[0.65rem] font-bold text-gray-600">Owner Full Name *</Label>
            <Input
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-10 rounded-xl text-xs font-bold bg-white"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[0.65rem] font-bold text-gray-600">Phone Number *</Label>
            <Input
              placeholder="+91..."
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="h-10 rounded-xl text-xs font-bold bg-white"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[0.65rem] font-bold text-gray-600">Email Address *</Label>
            <Input
              type="email"
              placeholder="chef@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-10 rounded-xl text-xs font-bold bg-white"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[0.65rem] font-bold text-gray-600">Password *</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="h-10 rounded-xl text-xs font-bold bg-white"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <Label className="text-[0.65rem] font-bold text-gray-600">Operating Address *</Label>
            <Input
              placeholder="Street, Locality, City, PIN"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="h-10 rounded-xl text-xs font-bold bg-white"
              required
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* 2. REGULATORY COMPLIANCE */}
      <div className="space-y-3 bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-100">
        <div className="flex items-center gap-2 border-b border-gray-200/60 pb-2">
          <ShieldCheck className="w-4 h-4 text-orange-600" />
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
            Licensing & Compliance
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <Label className="text-[0.65rem] font-bold text-gray-600">FSSAI License No. *</Label>
            <Input
              placeholder="10012011000XXX"
              value={formData.fssai}
              onChange={(e) => setFormData({ ...formData, fssai: e.target.value })}
              className="h-10 rounded-xl text-xs font-bold uppercase font-mono bg-white"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[0.65rem] font-bold text-gray-600">GST / PAN Number *</Label>
            <Input
              placeholder="22AAAAA0000A1Z5"
              value={formData.gst}
              onChange={(e) => setFormData({ ...formData, gst: e.target.value.toUpperCase() })}
              className="h-10 rounded-xl text-xs font-bold uppercase font-mono bg-white"
              required
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* 3. FINANCIAL NODES & UPI */}
      <div className="space-y-3 bg-orange-50/50 p-4 sm:p-5 rounded-2xl border border-orange-100">
        <div className="flex items-center justify-between border-b border-orange-200/60 pb-2">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-orange-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-orange-950">
              Payout Setup (UPI & Bank)
            </h3>
          </div>
          <span className="text-[0.6rem] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
            ⚡ Direct Payout
          </span>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-[0.65rem] font-bold text-gray-700 flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-orange-600" />
              Instant UPI ID (Recommended)
            </Label>
            <Input
              placeholder="e.g. chef@okhdfcbank or 9876543210@paytm"
              value={formData.upiId}
              onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
              className="h-10 rounded-xl text-xs font-bold font-mono bg-white"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <Label className="text-[0.65rem] font-bold text-gray-600">Bank Account Number</Label>
              <Input
                placeholder="Account Number"
                value={formData.bankAccount}
                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                className="h-10 rounded-xl text-xs font-bold font-mono bg-white"
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[0.65rem] font-bold text-gray-600">Bank IFSC Code</Label>
              <Input
                placeholder="HDFC0001234"
                value={formData.ifsc}
                onChange={(e) => setFormData({ ...formData, ifsc: e.target.value.toUpperCase() })}
                className="h-10 rounded-xl text-xs font-bold uppercase font-mono bg-white"
                disabled={loading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* STICKY / BOTTOM BUTTONS */}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 h-12 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-wider rounded-xl shadow-lg text-xs"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Provisioning Vendor...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Create & Activate Vendor
            </span>
          )}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="h-12 px-6 rounded-xl border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-xs"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}