'use client';

import { useState } from 'react';
import { Truck, CheckCircle2, XCircle, RefreshCcw, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeliveryOnboardingProps {
  user: any;
  profile: any;
  hasDeliveryPartner: boolean;
}

export default function DeliveryOnboarding({ user, profile, hasDeliveryPartner }: DeliveryOnboardingProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const createPartnerRecord = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/delivery/create-partner-record', {
        method: 'POST',
      });
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create delivery partner record');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { label: 'Account created', done: !!user },
    { label: 'Role set to Delivery Partner', done: profile?.role === 'delivery' },
    { label: 'Delivery partner record created', done: hasDeliveryPartner },
    { label: 'Verified by Admin', done: false },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center px-4 py-20">
      <div className="max-w-lg w-full space-y-8">
        {/* Icon & Title */}
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-orange-100 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl">
            <Truck className="w-12 h-12 text-orange-600" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-[#1A1A1A] uppercase italic tracking-tighter">
              Welcome, <span className="text-orange-600">{profile?.name?.split(' ')[0] || 'Partner'}</span>
            </h1>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2">
              Delivery Partner Onboarding
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100 space-y-4">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Setup Checklist</h2>
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
              {step.done ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-300 shrink-0" />
              )}
              <span className={`text-sm font-bold ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Error / Success message */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-2xl text-sm font-medium border border-green-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Record created! Refreshing dashboard…
          </div>
        )}

        {/* Action */}
        {!hasDeliveryPartner && profile?.role === 'delivery' && !success && (
          <Button
            onClick={createPartnerRecord}
            disabled={loading}
            className="w-full h-16 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest rounded-2xl text-sm shadow-xl"
          >
            {loading ? (
              <><RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> Setting Up…</>
            ) : (
              'Complete Setup'
            )}
          </Button>
        )}

        {hasDeliveryPartner && (
          <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100 text-center space-y-2">
            <Mail className="w-6 h-6 text-orange-500 mx-auto" />
            <p className="text-sm font-bold text-orange-800">
              Your profile is under review by our admin team.
            </p>
            <p className="text-xs text-orange-600 font-medium">
              You will receive a notification once you are verified and can start accepting orders.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}