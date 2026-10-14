'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/lib/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import {
  ChefHat,
  Truck,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Bell,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Phone,
  Mail,
  FileText,
  X,
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [declineReason, setDeclineReason] = useState(
    'Incomplete or unreadable compliance documents (FSSAI/License)'
  );
  const [blockReason, setBlockReason] = useState(
    'Violates platform compliance and terms of service'
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch pending applications (does NOT auto-popup)
  const fetchPendingApplications = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/partners/pending');
      const data = await res.json();
      if (data.success && Array.isArray(data.applications)) {
        setApplications(data.applications);
        if (data.applications.length === 0) {
          setIsReviewModalOpen(false);
          setIsDeclineModalOpen(false);
          setIsBlockModalOpen(false);
        }
      }
    } catch {
      // Background check failure is non-blocking
    }
  }, []);

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
              description: `${payload.new.name || 'Applicant'} just registered. Click notification pill to review.`,
            });
            setIsDismissed(false); // Un-dismiss so the new notification is visible
            fetchPendingApplications();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPendingApplications, toast]);

  const activeApplication = applications[currentIndex] || applications[0] || null;

  const handleVerify = async (action: 'accept' | 'decline' | 'block') => {
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
          reason:
            action === 'block' ? blockReason : action === 'decline' ? declineReason : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process application');

      toast({
        title:
          action === 'accept'
            ? '🎉 Partner Approved'
            : action === 'block'
              ? '🚫 Partner Blocked'
              : '⚠️ Application Declined',
        description: data.message,
      });

      // Remove from active list
      const updated = applications.filter((a) => a.user_id !== activeApplication.user_id);
      setApplications(updated);

      // Close sub-modals
      setIsDeclineModalOpen(false);
      setIsBlockModalOpen(false);

      if (updated.length === 0) {
        setIsReviewModalOpen(false);
      } else if (currentIndex >= updated.length) {
        setCurrentIndex(Math.max(0, updated.length - 1));
      }

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

  const handleNext = () => {
    if (currentIndex < applications.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <>
      {/* ── 1. NON-INTRUSIVE NOTIFICATION PILL (NO FORCED MODAL POPUP) ── */}
      {applications.length > 0 && !isDismissed && !isReviewModalOpen && (
        <aside
          role="region"
          aria-label="Pending applications notification"
          className="animate-in slide-in-from-top-4 fixed top-5 right-5 z-50 w-full max-w-sm rounded-2xl border border-white/15 bg-[#1A1A1A]/95 p-3.5 text-white shadow-2xl backdrop-blur-xl duration-300"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-500/30 bg-orange-600/20 text-orange-400">
                  <Bell className="h-4 w-4" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-orange-500"></span>
                </span>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[0.65rem] font-black tracking-wider text-orange-400 uppercase">
                    New Application
                  </span>
                  <span className="py-0.2 rounded-full bg-white/10 px-1.5 font-mono text-[0.6rem] font-bold text-gray-300">
                    {applications.length}
                  </span>
                </div>
                <p className="max-w-[170px] truncate text-xs font-bold text-gray-200">
                  {applications[0].name} ({applications[0].role === 'vendor' ? 'Chef' : 'Rider'})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setCurrentIndex(0);
                  setIsReviewModalOpen(true);
                }}
                className="h-8 cursor-pointer rounded-xl bg-orange-600 px-3 text-[0.65rem] font-black tracking-wider text-white uppercase hover:bg-orange-500"
              >
                Review
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsDismissed(true)}
                className="h-7 w-7 cursor-pointer rounded-lg text-gray-400 hover:bg-white/10 hover:text-white"
                title="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </aside>
      )}

      {/* ── 2. REVIEW MODAL (ONLY OPENED ON DELIBERATE ADMIN CLICK) ── */}
      {activeApplication && (
        <Dialog
          open={isReviewModalOpen && !isDeclineModalOpen && !isBlockModalOpen}
          onOpenChange={setIsReviewModalOpen}
        >
          <DialogContent className="my-auto flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-[2.5rem] border-none bg-white p-0 shadow-2xl">
            {/* Header */}
            <div className="relative shrink-0 bg-[#1A1A1A] px-6 py-5 text-white">
              <div
                className={`absolute top-0 right-0 h-36 w-36 ${activeApplication.role === 'vendor' ? 'bg-orange-600/20' : 'bg-blue-600/20'} pointer-events-none -mt-12 -mr-12 rounded-full blur-[50px]`}
              />

              <div className="relative z-10 space-y-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[0.6rem] font-black tracking-wider uppercase ${
                      activeApplication.role === 'vendor'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {activeApplication.role === 'vendor'
                      ? 'Home Chef Application'
                      : 'Rider Dispatch Application'}
                  </span>

                  {applications.length > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={currentIndex === 0}
                        onClick={handlePrev}
                        className="h-6 w-6 rounded p-0 text-gray-300 hover:bg-white/10 hover:text-white"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="px-1 font-mono text-[0.6rem] font-bold text-gray-400">
                        {currentIndex + 1} of {applications.length}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={currentIndex === applications.length - 1}
                        onClick={handleNext}
                        className="h-6 w-6 rounded p-0 text-gray-300 hover:bg-white/10 hover:text-white"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <DialogTitle className="text-xl leading-tight font-black tracking-tight text-white uppercase italic">
                  {activeApplication.role === 'vendor'
                    ? 'Home Chef Onboarding'
                    : 'Rider Dispatch Onboarding'}
                </DialogTitle>
                <DialogDescription className="text-xs font-semibold text-gray-400">
                  Review applicant profile, approve kitchen/pilot, decline with feedback, or block
                  partner
                </DialogDescription>
              </div>
            </div>

            {/* Details Body */}
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl font-black ${
                      activeApplication.role === 'vendor'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {activeApplication.role === 'vendor' ? (
                      <ChefHat className="h-5 w-5" />
                    ) : (
                      <Truck className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-black text-gray-900">{activeApplication.name}</div>
                    <div className="text-[0.65rem] font-bold tracking-wider text-gray-500 uppercase">
                      {activeApplication.business_name}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-gray-200/60 pt-2 text-gray-700">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span className="truncate font-mono text-gray-800">
                      {activeApplication.email}
                    </span>
                  </div>
                  {activeApplication.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span className="font-mono font-bold text-gray-900">
                        {activeApplication.phone}
                      </span>
                    </div>
                  )}
                  {activeApplication.detail && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span className="text-gray-600">{activeApplication.detail}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3 Action Buttons: Block, Decline, Accept */}
            <div className="flex shrink-0 flex-wrap gap-2 border-t border-gray-100 bg-white p-4 sm:flex-nowrap sm:p-5">
              {/* Block Option */}
              <Button
                type="button"
                variant="outline"
                disabled={isProcessing}
                onClick={() => setIsBlockModalOpen(true)}
                className="flex h-11 cursor-pointer items-center justify-center gap-1 rounded-xl border-red-200 px-3 text-[0.65rem] font-black tracking-wider text-red-700 uppercase hover:bg-red-50 hover:text-red-800"
                title="Permanently block this user and prevent future applications"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-red-600" /> Block
              </Button>

              {/* Decline Option */}
              <Button
                type="button"
                variant="outline"
                disabled={isProcessing}
                onClick={() => setIsDeclineModalOpen(true)}
                className="flex h-11 cursor-pointer items-center justify-center gap-1 rounded-xl border-gray-200 px-3 text-[0.65rem] font-black tracking-wider text-gray-700 uppercase hover:bg-gray-100"
              >
                <XCircle className="h-3.5 w-3.5 text-gray-500" /> Decline
              </Button>

              {/* Accept & Activate Option */}
              <Button
                type="button"
                disabled={isProcessing}
                onClick={() => handleVerify('accept')}
                className={`flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl text-xs font-black tracking-wider text-white uppercase shadow-lg ${
                  activeApplication.role === 'vendor'
                    ? 'bg-orange-600 hover:bg-orange-500'
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Accept & Activate
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── 3. DECLINE FEEDBACK MODAL ── */}
      {activeApplication && (
        <Dialog open={isDeclineModalOpen} onOpenChange={setIsDeclineModalOpen}>
          <DialogContent className="my-auto flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[2.5rem] border-none bg-white p-0 shadow-2xl">
            <div className="relative shrink-0 bg-[#1A1A1A] px-6 py-5 text-white">
              <div className="relative z-10 space-y-1">
                <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-[0.6rem] font-black tracking-wider text-red-400 uppercase">
                  Decline & Notify Applicant
                </span>
                <DialogTitle className="text-xl leading-tight font-black tracking-tight text-white uppercase italic">
                  Reason for Rejection
                </DialogTitle>
                <DialogDescription className="text-xs font-semibold text-gray-400">
                  This explanation will be delivered immediately to {activeApplication.name}&apos;s
                  device
                </DialogDescription>
              </div>
            </div>

            <div className="space-y-4 overflow-y-auto p-6">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">
                  Select Preset Feedback Reason
                </Label>
                <select
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold focus:outline-none"
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
                <Label className="text-xs font-bold text-gray-700">
                  Custom Message to Applicant *
                </Label>
                <Textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Explain what needs to be corrected for re-applying..."
                  className="min-h-[90px] rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex gap-3 border-t border-gray-100 bg-white p-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeclineModalOpen(false)}
                className="h-11 flex-1 rounded-xl text-xs font-bold uppercase"
              >
                Back
              </Button>
              <Button
                type="button"
                disabled={isProcessing}
                onClick={() => handleVerify('decline')}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600 text-xs font-black text-white uppercase hover:bg-red-500"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm & Decline'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── 4. BLOCK PARTNER MODAL ── */}
      {activeApplication && (
        <Dialog open={isBlockModalOpen} onOpenChange={setIsBlockModalOpen}>
          <DialogContent className="my-auto flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[2.5rem] border-none bg-white p-0 shadow-2xl">
            <div className="relative shrink-0 bg-[#1A1A1A] px-6 py-5 text-white">
              <div className="relative z-10 space-y-1">
                <span className="flex w-fit items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-[0.6rem] font-black tracking-wider text-white uppercase">
                  <ShieldAlert className="h-3 w-3" /> Account Suspension
                </span>
                <DialogTitle className="text-xl leading-tight font-black tracking-tight text-white uppercase italic">
                  Block {activeApplication.name}
                </DialogTitle>
                <DialogDescription className="text-xs font-semibold text-gray-400">
                  This will permanently suspend this account and block them from submitting further
                  partner requests.
                </DialogDescription>
              </div>
            </div>

            <div className="space-y-4 overflow-y-auto p-6">
              <div className="space-y-1 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="h-4 w-4 text-red-600" /> Permanent Action
                </div>
                <p className="text-[0.7rem] leading-relaxed text-red-700">
                  User <strong>{activeApplication.email}</strong> will be marked as inactive and
                  blocked. They will not be able to log in or apply again.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">Reason for Blocking *</Label>
                <select
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-xs font-bold focus:outline-none"
                >
                  <option value="Violates platform compliance and terms of service">
                    Violates platform compliance and terms of service
                  </option>
                  <option value="Fraudulent or falsified identity/license documents">
                    Fraudulent or falsified identity/license documents
                  </option>
                  <option value="Spam or repeated unauthorized applications">
                    Spam or repeated unauthorized applications
                  </option>
                  <option value="Security risk or previous misconduct">
                    Security risk or previous misconduct
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-gray-700">Internal Audit Note</Label>
                <Textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Additional context for blocking this partner..."
                  className="min-h-[80px] rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex gap-3 border-t border-gray-100 bg-white p-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBlockModalOpen(false)}
                className="h-11 flex-1 rounded-xl text-xs font-bold uppercase"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isProcessing}
                onClick={() => handleVerify('block')}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-700 text-xs font-black text-white uppercase shadow-lg shadow-red-900/20 hover:bg-red-800"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm & Block'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
