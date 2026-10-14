'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/hooks/use-toast';

interface VerificationActionsProps {
  userId: string;
  isVerified: boolean;
  isActive: boolean;
  role?: 'customer' | 'vendor' | 'delivery' | 'admin' | string;
}

export default function VerificationActions({
  userId,
  isVerified,
  isActive,
  role = 'vendor',
}: VerificationActionsProps) {
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="flex items-center justify-end gap-2">
      {!isVerified && (
        <>
          <Button
            size="sm"
            onClick={handleAcceptRequest}
            disabled={loading}
            className="h-8 rounded-xl bg-green-600 px-3 text-[0.6rem] font-black tracking-wider text-white uppercase shadow-md hover:bg-green-500"
          >
            Accept Request
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDeclineRequest}
            disabled={loading}
            className="h-8 rounded-xl bg-red-600 px-3 text-[0.6rem] font-black tracking-wider text-white uppercase shadow-md hover:bg-red-500"
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
            className="h-8 rounded-xl text-[0.6rem] font-black tracking-widest text-gray-600 italic hover:bg-gray-100"
          >
            •••
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="z-50 min-w-[13rem] space-y-1 rounded-2xl border border-white/15 bg-[#1A1A1A] p-1.5 text-white shadow-2xl backdrop-blur-2xl"
        >
          <DropdownMenuItem
            onClick={toggleVerification}
            className="cursor-pointer rounded-xl px-4 py-3 text-[0.65rem] font-black tracking-widest uppercase transition-colors focus:bg-white/10 focus:text-orange-500"
          >
            {isVerified ? 'Revoke Verification' : 'Grant Verification'}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={toggleStatus}
            className="cursor-pointer rounded-xl px-4 py-3 text-[0.65rem] font-black tracking-widest uppercase transition-colors focus:bg-white/10 focus:text-red-500"
          >
            {isActive ? 'Deactivate Account' : 'Activate Account'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
