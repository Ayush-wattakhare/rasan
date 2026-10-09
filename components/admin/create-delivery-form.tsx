'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, ShieldCheck, Landmark, Smartphone, Loader2, CheckCircle2, User } from 'lucide-react';

interface CreateDeliveryFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateDeliveryForm({ onSuccess, onCancel }: CreateDeliveryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    vehicleType: 'bike',
    vehicleNumber: '',
    licenseNumber: '',
    age: '',
    bloodGroup: '',
    emergencyContact: '',
    aadharNumber: '',
    upiId: '',
    bankAccountNumber: '',
    ifscCode: '',
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: 'delivery',
          bank_details: {
            upi_id: formData.upiId.trim(),
            account_number: formData.bankAccountNumber.trim(),
            ifsc_code: formData.ifscCode.trim().toUpperCase(),
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
        setError(result.error || 'Failed to create delivery partner');
      }
    } catch (err) {
      setError('An unexpected error occurred while creating the delivery partner');
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
          <User className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
            Pilot Identity & Credentials
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <Label className="text-[0.65rem] font-bold text-gray-600">Full Name *</Label>
            <Input
              placeholder="Rider Full Name"
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
              placeholder="+91 9999999999"
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
              placeholder="rider@example.com"
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

          <div className="space-y-1">
            <Label className="text-[0.65rem] font-bold text-gray-600">Emergency Contact *</Label>
            <Input
              placeholder="+91..."
              value={formData.emergencyContact}
              onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              className="h-10 rounded-xl text-xs font-bold bg-white"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[0.65rem] font-bold text-gray-600">Blood Group</Label>
            <Input
              placeholder="e.g. O+ / B+"
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
              className="h-10 rounded-xl text-xs font-bold bg-white"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* 2. COMPLIANCE & VEHICLE */}
      <div className="space-y-3 bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-100">
        <div className="flex items-center gap-2 border-b border-gray-200/60 pb-2">
          <Truck className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
            Vehicle & Regulatory Compliance
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <Label className="text-[0.65rem] font-bold text-gray-600">Vehicle Type *</Label>
            <select
              value={formData.vehicleType}
              onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
              className="w-full h-10 px-3 border border-gray-200 rounded-xl bg-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            >
              <option value="bike">Motorcycle</option>
              <option value="scooter">Electric Scooter</option>
              <option value="bicycle">Bicycle</option>
              <option value="car">Car / Van</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-[0.65rem] font-bold text-gray-600">Vehicle Number *</Label>
            <Input
              placeholder="MH 14 DA 2024"
              value={formData.vehicleNumber}
              onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
              className="h-10 rounded-xl text-xs font-bold uppercase font-mono bg-white"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[0.65rem] font-bold text-gray-600">Driving License No. *</Label>
            <Input
              placeholder="DL1234567890"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value.toUpperCase() })}
              className="h-10 rounded-xl text-xs font-bold uppercase font-mono bg-white"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[0.65rem] font-bold text-gray-600">Aadhaar / PAN Number *</Label>
            <Input
              placeholder="XXXX-XXXX-XXXX"
              value={formData.aadharNumber}
              onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value.toUpperCase() })}
              className="h-10 rounded-xl text-xs font-bold uppercase font-mono bg-white"
              required
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* 3. FINANCIAL NODES & UPI */}
      <div className="space-y-3 bg-blue-50/50 p-4 sm:p-5 rounded-2xl border border-blue-100">
        <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-blue-950">
              Rider Payout Setup (UPI & Bank)
            </h3>
          </div>
          <span className="text-[0.6rem] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
            ⚡ Instant Payout
          </span>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-[0.65rem] font-bold text-gray-700 flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
              Instant UPI ID (Recommended)
            </Label>
            <Input
              placeholder="e.g. rider@okhdfcbank or 9876543210@paytm"
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
                value={formData.bankAccountNumber}
                onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                className="h-10 rounded-xl text-xs font-bold font-mono bg-white"
                disabled={loading}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[0.65rem] font-bold text-gray-600">Bank IFSC Code</Label>
              <Input
                placeholder="SBIN0001234"
                value={formData.ifscCode}
                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
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
          className="flex-1 h-12 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider rounded-xl shadow-lg text-xs"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Provisioning Rider Node...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Create & Activate Rider
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