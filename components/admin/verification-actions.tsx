'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { ShieldAlert, Trash2, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface VerificationActionsProps {
  userId: string;
  vendorId?: string;
  isVerified: boolean;
  isActive: boolean;
  role?: 'customer' | 'vendor' | 'delivery' | 'admin' | string;
}

export default function VerificationActions({
  userId,
  vendorId,
  isVerified,
  isActive,
  role = 'vendor',
}: VerificationActionsProps) {
  const [loading, setLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState(
    'Violates platform compliance and terms of service'
  );
  const router = useRouter();
  const { toast } = useToast();

  const toggleVerification = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_verified: !isVerified }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update verification status');
      }

      toast({
        title: 'Success',
        description: `Personnel ${isVerified ? 'unverified' : 'verified'} successfully`,
      });
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }

      toast({
        title: 'Success',
        description: `Personnel ${isActive ? 'deactivated' : 'activated'} successfully`,
      });
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    setLoading(true);
    try {
      if (role === 'vendor' || role === 'delivery') {
        const response = await fetch('/api/admin/partners/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, role, action: 'accept' }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to approve application');
        toast({
          title: 'Application Accepted! ✅',
          description: data.message || 'User verified and account activated.',
        });
      } else {
        const response = await fetch(`/api/admin/users/${userId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_verified: true, is_active: true }),
        });
        if (!response.ok) throw new Error('Failed to approve application');
        toast({
          title: 'User Verified! ✅',
          description: 'Account verified and activated.',
        });
      }
      router.refresh();
    } catch (error: any) {
      toast({ title: 'Approval Failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineRequest = async () => {
    setLoading(true);
    try {
      if (role === 'vendor' || role === 'delivery') {
        const response = await fetch('/api/admin/partners/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            role,
            action: 'decline',
            reason: `Application declined by admin from ${role} registry.`,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to decline application');
        toast({
          title: 'Application Declined ❌',
          description: data.message || 'Account unlinked and applicant notified.',
          variant: 'destructive',
        });
      } else {
        const response = await fetch(`/api/admin/users/${userId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_verified: false, is_active: false }),
        });
        if (!response.ok) throw new Error('Failed to decline application');
        toast({
          title: 'Application Declined ❌',
          description: 'Account deactivated.',
          variant: 'destructive',
        });
      }
      router.refresh();
    } catch (error: any) {
      toast({ title: 'Decline Failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleBlockPartner = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/partners/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          role,
          action: 'block',
          reason: blockReason,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to block partner');
      toast({
        title: 'Partner Blocked 🚫',
        description: data.message || 'Account suspended and blocked permanently.',
        variant: 'destructive',
      });
      setIsBlockDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      toast({ title: 'Block Failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVendor = async () => {
    setLoading(true);
    try {
      const targetId = vendorId || userId;
      const response = await fetch(`/api/admin/vendors/${targetId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete vendor');
      toast({
        title: 'Vendor Deleted 🗑️',
        description: data.message || 'Vendor removed from registry.',
      });
      setIsDeleteDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      toast({ title: 'Deletion Failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        {!isVerified && (
          <>
            <Button
              size="sm"
              onClick={handleAcceptRequest}
              disabled={loading}
              className="h-8 cursor-pointer rounded-xl bg-green-600 px-3 text-[0.6rem] font-black tracking-wider text-white uppercase shadow-md hover:bg-green-500"
            >
              Accept Request
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDeclineRequest}
              disabled={loading}
              className="h-8 cursor-pointer rounded-xl bg-red-600 px-3 text-[0.6rem] font-black tracking-wider text-white uppercase shadow-md hover:bg-red-500"
            >
              Decline
            </Button>
          </>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={loading}
              className="h-8 cursor-pointer rounded-xl text-[0.6rem] font-black tracking-widest text-gray-600 italic hover:bg-gray-100"
            >
              •••
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="z-50 min-w-[14rem] space-y-1 rounded-2xl border border-white/15 bg-[#1A1A1A] p-1.5 text-white shadow-2xl backdrop-blur-2xl"
          >
            <DropdownMenuItem
              onClick={toggleVerification}
              className="cursor-pointer rounded-xl px-4 py-2.5 text-[0.65rem] font-black tracking-widest uppercase transition-colors focus:bg-white/10 focus:text-orange-500"
            >
              {isVerified ? 'Revoke Verification' : 'Grant Verification'}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={toggleStatus}
              className="cursor-pointer rounded-xl px-4 py-2.5 text-[0.65rem] font-black tracking-widest uppercase transition-colors focus:bg-white/10 focus:text-amber-500"
            >
              {isActive ? 'Deactivate Storefront' : 'Activate Storefront'}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setIsBlockDialogOpen(true)}
              className="flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-[0.65rem] font-black tracking-widest text-red-400 uppercase transition-colors focus:bg-red-950/60 focus:text-red-300"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-red-500" /> Block & Suspend
            </DropdownMenuItem>

            {(role === 'vendor' || vendorId) && (
              <>
                <DropdownMenuSeparator className="my-1 bg-white/10" />
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-[0.65rem] font-black tracking-widest text-red-500 uppercase transition-colors focus:bg-red-950/80 focus:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" /> Delete Vendor
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── DELETE VENDOR CONFIRMATION DIALOG ── */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="my-auto flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[2.5rem] border-none bg-white p-0 shadow-2xl">
          <div className="relative shrink-0 bg-[#1A1A1A] px-6 py-5 text-white">
            <div className="relative z-10 space-y-1">
              <span className="flex w-fit items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-[0.6rem] font-black tracking-wider text-white uppercase">
                <Trash2 className="h-3 w-3" /> Permanent Deletion
              </span>
              <DialogTitle className="text-xl leading-tight font-black tracking-tight text-white uppercase italic">
                Delete Vendor Record
              </DialogTitle>
              <DialogDescription className="text-xs font-semibold text-gray-400">
                Permanently erase this vendor storefront from the registry.
              </DialogDescription>
            </div>
          </div>

          <div className="space-y-4 p-6">
            <div className="space-y-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
              <div className="flex items-center gap-2 text-sm font-bold text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" /> Are you sure?
              </div>
              <p className="text-[0.7rem] leading-relaxed text-red-700">
                This will permanently delete the vendor storefront and all linked meals and
                subscriptions. The user account will remain active as a standard customer.
              </p>
            </div>
          </div>

          <div className="flex gap-3 border-t border-gray-100 bg-white p-4">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setIsDeleteDialogOpen(false)}
              className="h-11 flex-1 cursor-pointer rounded-xl text-xs font-bold uppercase"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={loading}
              onClick={handleDeleteVendor}
              className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-red-600 text-xs font-black text-white uppercase shadow-lg shadow-red-900/20 hover:bg-red-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4" /> Confirm Delete
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── BLOCK & SUSPEND PARTNER DIALOG ── */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent className="my-auto flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-[2.5rem] border-none bg-white p-0 shadow-2xl">
          <div className="relative shrink-0 bg-[#1A1A1A] px-6 py-5 text-white">
            <div className="relative z-10 space-y-1">
              <span className="flex w-fit items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-[0.6rem] font-black tracking-wider text-white uppercase">
                <ShieldAlert className="h-3 w-3" /> Account Suspension
              </span>
              <DialogTitle className="text-xl leading-tight font-black tracking-tight text-white uppercase italic">
                Block Partner Account
              </DialogTitle>
              <DialogDescription className="text-xs font-semibold text-gray-400">
                Permanently suspend this user and block them from partner operations.
              </DialogDescription>
            </div>
          </div>

          <div className="space-y-4 p-6">
            <div className="space-y-1 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldAlert className="h-4 w-4 text-red-600" /> Account Will Be Deactivated
              </div>
              <p className="text-[0.7rem] leading-relaxed text-red-700">
                The account will be marked as inactive and blocked. They will not be able to log in
                or submit partner requests.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Reason for Blocking *</Label>
              <Textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Reason for suspending this account..."
                className="min-h-[80px] rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="flex gap-3 border-t border-gray-100 bg-white p-4">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => setIsBlockDialogOpen(false)}
              className="h-11 flex-1 cursor-pointer rounded-xl text-xs font-bold uppercase"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={loading}
              onClick={handleBlockPartner}
              className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-red-700 text-xs font-black text-white uppercase shadow-lg shadow-red-900/20 hover:bg-red-800"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm & Block'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
