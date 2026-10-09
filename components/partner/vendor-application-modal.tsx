'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/lib/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { ChefHat, X, CheckCircle2, Loader2, UserCheck, ShieldCheck, ArrowRight } from 'lucide-react';

interface VendorApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VendorApplicationModal({ isOpen, onClose }: VendorApplicationModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    businessName: '',
    address: '',
    phone: '',
    fssai: '',
    gst: '',
    bankAccount: '',
    ifsc: '',
    cuisine: 'Indian',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        setFormData((prev) => ({
          ...prev,
          email: user.email || '',
          phone: prev.phone || user.phone || '',
        }));
      }
    }
    if (isOpen) {
      checkAuth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/become-vendor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      if (data.alreadyExists) {
        setAlreadyRegistered(true);
        toast({
          title: 'Already Registered! 🍳',
          description: data.message || 'You already have an active or pending chef profile.',
        });
      } else {
        setSubmitted(true);
        // If an account was just created, sign them in automatically
        if (data.createdAccount && formData.email && formData.password) {
          await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });
        }
        toast({
          title: 'Application Submitted! 🎉',
          description: 'Your chef application has been received and is under review.',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Application Notice',
        description: err.message || 'Could not submit application',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    onClose();
    router.push('/vendor-dashboard');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {alreadyRegistered ? (
          <div className="p-10 sm:p-12 text-center space-y-6">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto text-orange-600">
              <ChefHat className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase italic text-gray-900">Chef Profile Active</h2>
              <p className="text-sm font-medium text-gray-500 max-w-md mx-auto">
                You already have a registered home chef profile! You can manage dishes, view orders, and coordinate daily subscriber menus right from your chef portal.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                onClick={handleGoToDashboard}
                className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest px-8 h-12 rounded-xl w-full sm:w-auto shadow-lg"
              >
                Open Chef Terminal <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="h-12 rounded-xl font-bold text-gray-600 w-full sm:w-auto"
              >
                Close
              </Button>
            </div>
          </div>
        ) : submitted ? (
          <div className="p-10 sm:p-12 text-center space-y-6">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase italic text-gray-900">Application Under Review</h2>
              <p className="text-sm font-medium text-gray-500 max-w-md mx-auto">
                Thank you for applying! Your kitchen application for <strong>{formData.businessName}</strong> has been transmitted to our Admin Registry. You can begin exploring your chef dashboard.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                onClick={handleGoToDashboard}
                className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest px-8 h-12 rounded-xl w-full sm:w-auto shadow-lg"
              >
                Go to Chef Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="h-12 rounded-xl font-bold text-gray-600 w-full sm:w-auto"
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <Card className="border-none shadow-none">
            <CardHeader className="bg-[#1A1A1A] text-white p-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-600/20 rounded-2xl flex items-center justify-center text-orange-500">
                  <ChefHat className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black uppercase italic tracking-tight">Apply as Home Chef / Vendor</CardTitle>
                  <CardDescription className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Submit kitchen information for admin verification
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="p-8 space-y-6">
                {/* Account status or creation */}
                {currentUser ? (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold">
                    <UserCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span>Logged in as <strong>{currentUser.email}</strong>.</span>
                      <p className="text-[0.7rem] text-emerald-600 font-medium">Your account will be upgraded to Home Chef partner upon submission.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 p-5 rounded-2xl bg-orange-50/70 border border-orange-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-widest text-orange-700">Account Credentials</h4>
                      <Link href="/login?redirect=/become-vendor" className="text-xs font-bold text-orange-600 hover:underline">
                        Already have an account? Log in
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="fullName" className="text-xs font-bold">Your Full Name *</Label>
                        <Input
                          id="fullName"
                          placeholder="Anita Sharma"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          required
                          disabled={loading}
                          className="bg-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-xs font-bold">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="chef@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          disabled={loading}
                          className="bg-white"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <Label htmlFor="password" className="text-xs font-bold">Create Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="At least 6 characters"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                          minLength={6}
                          disabled={loading}
                          className="bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-orange-600 border-b border-gray-100 pb-2">
                    Kitchen & Brand Identity
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Kitchen / Brand Name *</Label>
                      <Input
                        id="businessName"
                        placeholder="Mama's Delicacies"
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Contact Phone Number *</Label>
                      <Input
                        id="phone"
                        placeholder="+91 9876543210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Operating Kitchen Address *</Label>
                    <Input
                      id="address"
                      placeholder="Flat 4B, Sunshine Apartments, MG Road, Pune"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Kitchen Story / Specialty</Label>
                    <Input
                      id="description"
                      placeholder="Authentic North Indian & Malvani meals prepared fresh daily"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-orange-600 border-b border-gray-100 pb-2">
                    Compliance & Banking
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fssai">FSSAI Registration No.</Label>
                      <Input
                        id="fssai"
                        placeholder="22221111000XXX"
                        value={formData.fssai}
                        onChange={(e) => setFormData({ ...formData, fssai: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gst">GSTIN / PAN</Label>
                      <Input
                        id="gst"
                        placeholder="22AAAAA0000A1Z5"
                        value={formData.gst}
                        onChange={(e) => setFormData({ ...formData, gst: e.target.value.toUpperCase() })}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankAccount">Payout Bank Account</Label>
                      <Input
                        id="bankAccount"
                        placeholder="Account Number"
                        value={formData.bankAccount}
                        onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ifsc">IFSC Code</Label>
                      <Input
                        id="ifsc"
                        placeholder="SBIN0001234"
                        value={formData.ifsc}
                        onChange={(e) => setFormData({ ...formData, ifsc: e.target.value.toUpperCase() })}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 rounded-xl h-12 text-xs font-bold uppercase tracking-wider"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl h-12 text-xs uppercase tracking-wider shadow-lg"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Submit Partnership Application'}
                  </Button>
                </div>

                <div className="text-center pt-2">
                  <Link
                    href="/register?role=vendor"
                    onClick={onClose}
                    className="text-xs font-semibold text-gray-500 hover:text-orange-600 transition"
                  >
                    Prefer the 3-step registration wizard? <span className="underline font-bold">Open Full Registration</span> →
                  </Link>
                </div>
              </CardContent>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
