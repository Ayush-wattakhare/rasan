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
import { Bike, X, CheckCircle2, Loader2, UserCheck, ShieldCheck, ArrowRight } from 'lucide-react';

interface DeliveryApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeliveryApplicationModal({ isOpen, onClose }: DeliveryApplicationModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    vehicleType: 'bike',
    vehicleNumber: '',
    licenseNumber: '',
    age: '',
    bloodGroup: '',
    emergencyContact: '',
    aadharNumber: '',
    bankAccountNumber: '',
    ifscCode: '',
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
      const res = await fetch('/api/become-delivery-partner', {
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
          title: 'Already Registered! 🛵',
          description: data.message || 'You already have an active or pending delivery partner profile.',
        });
      } else {
        setSubmitted(true);
        // If account was just created, sign them in automatically
        if (data.createdAccount && formData.email && formData.password) {
          await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });
        }
        toast({
          title: 'Application Submitted! 🛵',
          description: 'Your rider application has been received and is under review.',
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
    router.push('/delivery-dashboard');
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
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600">
              <Bike className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase italic text-gray-900">Rider Profile Active</h2>
              <p className="text-sm font-medium text-gray-500 max-w-md mx-auto">
                You already have a delivery partner profile registered! You can toggle online status, accept pickups, and track daily earnings in your delivery terminal.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                onClick={handleGoToDashboard}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest px-8 h-12 rounded-xl w-full sm:w-auto shadow-lg"
              >
                Open Delivery Terminal <ArrowRight className="w-4 h-4 ml-2" />
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
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase italic text-gray-900">Application Under Review</h2>
              <p className="text-sm font-medium text-gray-500 max-w-md mx-auto">
                Thank you for applying to join the Rasan Delivery Corps! Vehicle <strong>{formData.vehicleNumber}</strong> has been transmitted to our Admin Registry. You can now explore the delivery dashboard.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                onClick={handleGoToDashboard}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest px-8 h-12 rounded-xl w-full sm:w-auto shadow-lg"
              >
                Go to Delivery Terminal <ArrowRight className="w-4 h-4 ml-2" />
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
            <CardHeader className="bg-[#121212] text-white p-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-400">
                  <Bike className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black uppercase italic tracking-tight">Apply as Delivery Partner</CardTitle>
                  <CardDescription className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Submit vehicle and compliance details for admin verification
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="p-8 space-y-6">
                {/* Account status or creation */}
                {currentUser ? (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-800 text-xs font-semibold">
                    <UserCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div>
                      <span>Logged in as <strong>{currentUser.email}</strong>.</span>
                      <p className="text-[0.7rem] text-indigo-600 font-medium">Your account will be upgraded to Delivery Partner upon submission.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-widest text-indigo-700">Rider Account Credentials</h4>
                      <Link href="/login?redirect=/become-delivery-partner" className="text-xs font-bold text-indigo-600 hover:underline">
                        Already have an account? Log in
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="fullName" className="text-xs font-bold">Your Full Name *</Label>
                        <Input
                          id="fullName"
                          placeholder="Rahul Verma"
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
                          placeholder="rider@example.com"
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
                  <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 border-b border-gray-100 pb-2">
                    Vehicle & License Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vehicleType">Vehicle Category *</Label>
                      <select
                        id="vehicleType"
                        value={formData.vehicleType}
                        onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                        disabled={loading}
                      >
                        <option value="bike">Motorcycle / Bike</option>
                        <option value="scooter">Electric Scooter</option>
                        <option value="bicycle">Bicycle</option>
                        <option value="car">Car / Van</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vehicleNumber">Vehicle Registration Number *</Label>
                      <Input
                        id="vehicleNumber"
                        placeholder="MH12AB1234"
                        value={formData.vehicleNumber}
                        onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="licenseNumber">Driving License Number *</Label>
                      <Input
                        id="licenseNumber"
                        placeholder="DL1234567890"
                        value={formData.licenseNumber}
                        onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value.toUpperCase() })}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact">Emergency Contact *</Label>
                      <Input
                        id="emergencyContact"
                        placeholder="+91 9876543210"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 border-b border-gray-100 pb-2">
                    Identity & Compliance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="aadharNumber">Aadhar / PAN Number</Label>
                      <Input
                        id="aadharNumber"
                        placeholder="XXXX-XXXX-XXXX"
                        value={formData.aadharNumber}
                        onChange={(e) => setFormData({ ...formData, aadharNumber: e.target.value.toUpperCase() })}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bloodGroup">Blood Group</Label>
                      <Input
                        id="bloodGroup"
                        placeholder="O+"
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankAccountNumber">Payout Bank Account</Label>
                      <Input
                        id="bankAccountNumber"
                        placeholder="Account Number"
                        value={formData.bankAccountNumber}
                        onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ifscCode">IFSC Code</Label>
                      <Input
                        id="ifscCode"
                        placeholder="SBIN0001234"
                        value={formData.ifscCode}
                        onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
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
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl h-12 text-xs uppercase tracking-wider shadow-lg"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Submit Delivery Application'}
                  </Button>
                </div>

                <div className="text-center pt-2">
                  <Link
                    href="/register?role=delivery"
                    onClick={onClose}
                    className="text-xs font-semibold text-gray-500 hover:text-indigo-600 transition"
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
