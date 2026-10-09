'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/lib/hooks/use-toast';
import { 
  Store, Phone, Mail, MapPin, Clock, ChefHat, Save, 
  CheckCircle2, RefreshCcw, Landmark, Smartphone, ShieldCheck
} from 'lucide-react';

interface VendorProfileFormProps {
  vendor: any;
}

const DAY_LABELS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function VendorProfileForm({ vendor }: VendorProfileFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    business_name: vendor.business_name || '',
    description: vendor.description || '',
    address: vendor.address || '',
    phone: vendor.phone || '',
    email: vendor.email || '',
    cuisine: (vendor.cuisine || []).join(', '),
    is_active: vendor.is_active ?? true,
    upi_id: vendor.bank_details?.upi_id || '',
    account_number: vendor.bank_details?.account_number || '',
    ifsc_code: vendor.bank_details?.ifsc_code || '',
    account_holder_name: vendor.bank_details?.account_holder_name || '',
    bank_name: vendor.bank_details?.bank_name || '',
    operating_hours: vendor.operating_hours || {
      monday: { is_open: true, open_time: '08:00', close_time: '21:00' },
      tuesday: { is_open: true, open_time: '08:00', close_time: '21:00' },
      wednesday: { is_open: true, open_time: '08:00', close_time: '21:00' },
      thursday: { is_open: true, open_time: '08:00', close_time: '21:00' },
      friday: { is_open: true, open_time: '08:00', close_time: '21:00' },
      saturday: { is_open: true, open_time: '09:00', close_time: '22:00' },
      sunday: { is_open: false, open_time: '09:00', close_time: '20:00' },
    },
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const bankDetails = {
        upi_id: form.upi_id.trim(),
        account_number: form.account_number.trim(),
        ifsc_code: form.ifsc_code.trim().toUpperCase(),
        account_holder_name: form.account_holder_name.trim(),
        bank_name: form.bank_name.trim(),
        preferred_payout_method: (form.upi_id ? 'upi' : 'bank') as 'upi' | 'bank',
      };

      const supabase = createClient();
      const { error } = await supabase
        .from('vendors')
        .update({
          business_name: form.business_name.trim(),
          description: form.description.trim() || null,
          address: form.address.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          cuisine: form.cuisine.split(',').map((c: string) => c.trim()).filter(Boolean),
          is_active: form.is_active,
          bank_details: bankDetails,
          operating_hours: form.operating_hours,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vendor.id);

      if (error) throw error;

      toast({
        title: 'Profile & Financial Details Saved',
        description: 'Your vendor profile, UPI ID, and bank details have been updated.',
      });
      router.refresh();
    } catch (err: any) {
      toast({
        title: 'Update Failed',
        description: err.message || 'Could not save your profile.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateHours = (day: string, field: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      operating_hours: {
        ...prev.operating_hours,
        [day]: {
          ...prev.operating_hours[day],
          [field]: value,
        },
      },
    }));
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-32">
      {/* Header */}
      <section className="relative overflow-hidden bg-[#1A1A1A] py-12 px-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="container mx-auto relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
              <Store className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-[0.6rem] font-black text-white uppercase tracking-[0.3em] italic">Profile & Financials</span>
            </div>
            <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter">
              EDIT <span className="text-orange-600">PROFILE & PAYOUTS</span>
            </h1>
          </div>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="h-14 px-8 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl cursor-pointer"
          >
            {loading ? (
              <><RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Save Profile</>
            )}
          </Button>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-8 py-10 space-y-8 -mt-6 relative z-20">

        {/* Basic Info */}
        <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
            <ChefHat className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-black text-gray-900 uppercase italic tracking-tighter">Business Information</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-gray-500">Business Name *</Label>
              <Input
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                className="h-12 rounded-xl border-gray-200"
                placeholder="My Home Kitchen"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-gray-500">Cuisine Types (comma separated)</Label>
              <Input
                value={form.cuisine}
                onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
                className="h-12 rounded-xl border-gray-200"
                placeholder="North Indian, South Indian, Home Style"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-gray-500">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="rounded-xl border-gray-200 min-h-[100px]"
                placeholder="Tell customers about your kitchen, specialties, and cooking style..."
              />
            </div>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div>
              <p className="font-black text-sm text-gray-900 uppercase tracking-wide">Kitchen Status</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Toggle your kitchen active/inactive for orders</p>
            </div>
            <button
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${form.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${form.is_active ? 'left-8' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {/* Financial Details (UPI & Bank Account) */}
        <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-5">
            <div className="flex items-center gap-3">
              <Landmark className="w-5 h-5 text-orange-600" />
              <div>
                <h2 className="text-lg font-black text-gray-900 uppercase italic tracking-tighter">
                  Payout Gateway (UPI & Bank Details)
                </h2>
                <p className="text-xs text-gray-400 font-semibold">Where your food sales revenue will be settled</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-50 text-green-700 text-[0.6rem] font-black uppercase rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Direct Settlement
            </span>
          </div>

          <div className="space-y-6">
            {/* UPI ID */}
            <div className="p-5 rounded-2xl bg-orange-50/60 border border-orange-100 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-black uppercase tracking-widest text-orange-950 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-orange-600" />
                  Instant UPI ID (Recommended)
                </Label>
                <span className="text-[0.6rem] font-bold text-orange-600 bg-orange-100 px-2.5 py-0.5 rounded-full">
                  ⚡ 1-Minute Settlement
                </span>
              </div>
              <Input
                value={form.upi_id}
                onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
                className="h-12 rounded-xl border-gray-200 bg-white font-mono text-xs font-bold"
                placeholder="e.g. chef@okhdfcbank or 9876543210@paytm"
              />
              <p className="text-[0.65rem] text-gray-500">
                Works with Google Pay, PhonePe, Paytm, BHIM, and bank UPI apps.
              </p>
            </div>

            {/* Direct Bank Account */}
            <div className="grid gap-5 md:grid-cols-2 pt-2">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-gray-500">Account Holder Name</Label>
                <Input
                  value={form.account_holder_name}
                  onChange={(e) => setForm({ ...form, account_holder_name: e.target.value })}
                  className="h-12 rounded-xl border-gray-200"
                  placeholder="Name as per Bank Passbook"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-gray-500">Bank Name</Label>
                <Input
                  value={form.bank_name}
                  onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                  className="h-12 rounded-xl border-gray-200"
                  placeholder="e.g. State Bank of India / HDFC"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-gray-500">Bank Account Number</Label>
                <Input
                  value={form.account_number}
                  onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                  className="h-12 rounded-xl border-gray-200 font-mono"
                  placeholder="Account Number"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-gray-500">IFSC Code</Label>
                <Input
                  value={form.ifsc_code}
                  onChange={(e) => setForm({ ...form, ifsc_code: e.target.value.toUpperCase() })}
                  className="h-12 rounded-xl border-gray-200 uppercase font-mono font-bold"
                  placeholder="e.g. SBIN0001234"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
            <Phone className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-black text-gray-900 uppercase italic tracking-tighter">Contact Details</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-gray-500"><Phone className="w-3 h-3 inline mr-1" />Phone *</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="h-12 rounded-xl border-gray-200"
                placeholder="+91 9999999999"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-gray-500"><Mail className="w-3 h-3 inline mr-1" />Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-12 rounded-xl border-gray-200"
                placeholder="kitchen@example.com"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-gray-500"><MapPin className="w-3 h-3 inline mr-1" />Address *</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="h-12 rounded-xl border-gray-200"
                placeholder="Street, Area, City, State, PIN"
              />
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-gray-100 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-5">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-black text-gray-900 uppercase italic tracking-tighter">Operating Hours</h2>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const mon = form.operating_hours.monday || { is_open: true, open_time: '09:00', close_time: '21:00' };
                const updated: Record<string, typeof mon> = {};
                DAY_LABELS.forEach((d) => {
                  updated[d] = { ...mon };
                });
                setForm({ ...form, operating_hours: updated as any });
                toast({
                  title: 'Preset Applied',
                  description: 'Copied Monday schedule (09:00 - 21:00) to all days.',
                });
              }}
              className="text-xs font-bold text-orange-600 border-orange-200 hover:bg-orange-50 rounded-xl"
            >
              Apply Monday to All Days
            </Button>
          </div>
          <div className="space-y-3">
            {DAY_LABELS.map((day) => {
              const hours = form.operating_hours[day] || { is_open: false, open_time: '09:00', close_time: '21:00' };
              return (
                <div key={day} className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${hours.is_open ? 'bg-orange-50/50 border border-orange-100' : 'bg-gray-50 border border-transparent'}`}>
                  <button
                    onClick={() => updateHours(day, 'is_open', !hours.is_open)}
                    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${hours.is_open ? 'bg-orange-500' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${hours.is_open ? 'left-5' : 'left-0.5'}`} />
                  </button>
                  <span className="w-28 text-xs font-black uppercase tracking-widest text-gray-600 capitalize">{day}</span>
                  {hours.is_open ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="time"
                        value={hours.open_time}
                        onChange={(e) => updateHours(day, 'open_time', e.target.value)}
                        className="h-9 rounded-lg text-sm border-gray-200 max-w-[120px]"
                      />
                      <span className="text-xs text-gray-400 font-bold">to</span>
                      <Input
                        type="time"
                        value={hours.close_time}
                        onChange={(e) => updateHours(day, 'close_time', e.target.value)}
                        className="h-9 rounded-lg text-sm border-gray-200 max-w-[120px]"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Closed</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="h-14 px-12 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl cursor-pointer"
          >
            {loading ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            {loading ? 'Saving Profile…' : 'Save All Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
