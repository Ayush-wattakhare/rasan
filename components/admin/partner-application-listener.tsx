'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/lib/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { 
  ChefHat, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  AlertTriangle, 
  Loader2, 
  Phone, 
  Mail, 
  FileText,
  User
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface PendingPartnerApplication {
  id: string;
  user_id: string;
  role: 'vendor' | 'delivery';
  name: string;
  business_name: string;
  email: string;
  phone?: string;
  detail?: string;
  created_at: string;
}

export function PartnerApplicationListener() {
  const { toast } = useToast();
  const router = useRouter();
  const [applications, setApplications] = useState<PendingPartnerApplication[]>([]);
  const [activeApplication, setActiveApplication] = useState<PendingPartnerApplication | null>(null);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('Incomplete or unreadable compliance documents (FSSAI/License)');
  const [isProcessing, setIsProcessing] = useState(false);

  // Poll & fetch pending applications
  const fetchPendingApplications = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/partners/pending');
      const data = await res.json();
      if (data.success && data.applications?.length > 0) {
        setApplications(data.applications);
        // If no modal is currently open, pop up the most recent application
        if (!activeApplication && !isDeclineModalOpen) {
          setActiveApplication(data.applications[0]);
        }
      }
    } catch {}
  }, [activeApplication, isDeclineModalOpen]);

  useEffect(() => {
    fetchPendingApplications();

    // Listen to real-time partner registrations
    const supabase = createClient();
    const channel = supabase
      .channel('admin-partner-applications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        (payload: any) => {
          if (payload.new && (payload.new.role === 'vendor' || payload.new.role === 'delivery')) {
            toast({
              title: `🚨 New ${payload.new.role === 'vendor' ? 'Home Chef' : 'Delivery Rider'} Application!`,
              description: `${payload.new.name} just registered. Tap to review & approve.`,
            });
            fetchPendingApplications();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPendingApplications, toast]);

  const handleVerify = async (action: 'accept' | 'decline') => {
    if (!activeApplication) return;
    setIsProcessing(true);

    try {
      const res = await fetch('/api/admin/partners/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeApplication.user_id,
          partnerId: activeApplication.id,
          role: activeApplication.role,
          action,
          reason: action === 'decline' ? declineReason : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process application');

      toast({
        title: action === 'accept' ? '🎉 Partner Approved' : '⚠️ Application Declined',
        description: data.message,
      });

      // Remove from active list
      setApplications(prev => prev.filter(a => a.user_id !== activeApplication.user_id));
      setActiveApplication(null);
      setIsDeclineModalOpen(false);
      router.refresh();
    } catch (err: any) {
      toast({
        title: 'Action Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!activeApplication) return null;

  return (
    <>
      {/* 1. Main Action / Approval Pop-up Modal */}
      <Dialog open={!!activeApplication && !isDeclineModalOpen} onOpenChange={(open) => !open && setActiveApplication(null)}>
        <DialogContent className="max-w-md w-full p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white max-h-[90vh] flex flex-col my-auto">
          {/* Header */}
          <div className="bg-[#1A1A1A] px-6 py-5 text-white relative shrink-0">
            <div className={`absolute top-0 right-0 w-36 h-36 ${activeApplication.role === 'vendor' ? 'bg-orange-600/20' : 'bg-blue-600/20'} rounded-full blur-[50px] -mr-12 -mt-12 pointer-events-none`} />
            
            <div className="relative z-10 space-y-1">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-[0.6rem] font-black uppercase tracking-wider ${
                  activeApplication.role === 'vendor' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  🚨 New Application Received
                </span>
                <span className="text-[0.6rem] font-bold text-gray-400 font-mono">
                  {applications.length > 1 ? `1 of ${applications.length}` : 'Pending'}
                </span>
              </div>
              <DialogTitle className="text-xl font-black uppercase italic tracking-tight text-white leading-tight">
                {activeApplication.role === 'vendor' ? 'Home Chef Onboarding' : 'Rider Dispatch Onboarding'}
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-xs font-semibold">
                Review applicant profile, approve kitchen/pilot, or decline with feedback
              </DialogDescription>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                  activeApplication.role === 'vendor' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {activeApplication.role === 'vendor' ? <ChefHat className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                </div>
                <div>
                  <div className="font-black text-sm text-gray-900">{activeApplication.name}</div>
                  <div className="font-bold text-[0.65rem] text-gray-500 uppercase tracking-wider">
                    {activeApplication.business_name}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-gray-200/60 text-gray-700">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-mono">{activeApplication.email}</span>
                </div>
                {activeApplication.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-mono font-bold text-gray-900">{activeApplication.phone}</span>
                  </div>
                )}
                {activeApplication.detail && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                    <span>{activeApplication.detail}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-white flex gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              disabled={isProcessing}
              onClick={() => setIsDeclineModalOpen(true)}
              className="flex-1 h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <XCircle className="w-4 h-4" /> Decline
            </Button>
            <Button
              type="button"
              disabled={isProcessing}
              onClick={() => handleVerify('accept')}
              className={`flex-[1.5] h-12 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-pointer ${
                activeApplication.role === 'vendor' ? 'bg-orange-600 hover:bg-orange-500' : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Accept & Activate
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Decline Reason Input Modal */}
      <Dialog open={isDeclineModalOpen} onOpenChange={setIsDeclineModalOpen}>
        <DialogContent className="max-w-md w-full p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white max-h-[90vh] flex flex-col my-auto">
          <div className="bg-[#1A1A1A] px-6 py-5 text-white relative shrink-0">
            <div className="relative z-10 space-y-1">
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[0.6rem] font-black uppercase tracking-wider">
                Decline & Notify Applicant
              </span>
              <DialogTitle className="text-xl font-black uppercase italic tracking-tight text-white leading-tight">
                Reason for Rejection
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-xs font-semibold">
                This explanation will be delivered immediately to {activeApplication.name}&apos;s device
              </DialogDescription>
            </div>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Select Preset Feedback Reason</Label>
              <select
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full h-11 px-3 border border-gray-200 rounded-xl bg-white text-xs font-bold focus:outline-none"
              >
                <option value="Incomplete or unreadable compliance documents (FSSAI/License)">
                  Incomplete or unreadable documents (FSSAI/License)
                </option>
                <option value="Location outside our active delivery cluster radius">
                  Location outside active operational delivery radius
                </option>
                <option value="Phone number verification failed or unreachable">
                  Phone verification failed / Unreachable
                </option>
                <option value="Vehicle details could not be authenticated with RTO">
                  Vehicle details unauthenticated
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Custom Message to Applicant *</Label>
              <Textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Explain what needs to be corrected for re-applying..."
                className="rounded-xl text-xs min-h-[90px]"
              />
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-white flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeclineModalOpen(false)}
              className="flex-1 h-11 rounded-xl text-xs font-bold uppercase"
            >
              Back
            </Button>
            <Button
              type="button"
              disabled={isProcessing}
              onClick={() => handleVerify('decline')}
              className="flex-1 h-11 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase rounded-xl flex items-center justify-center gap-1.5"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Dispatch Message'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
