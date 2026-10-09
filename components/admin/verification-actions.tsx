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
}

export default function VerificationActions({ userId, isVerified, isActive }: VerificationActionsProps) {
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
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_verified: true, is_active: true }),
      });
      if (!response.ok) throw new Error('Failed to approve application');
      toast({
        title: 'Application Accepted! ✅',
        description: 'User verified and account activated.',
      });
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
            className="bg-green-600 hover:bg-green-500 text-white font-black text-[0.6rem] uppercase tracking-wider px-3 h-8 rounded-xl shadow-md"
          >
            Accept Request
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDeclineRequest}
            disabled={loading}
            className="bg-red-600 hover:bg-red-500 text-white font-black text-[0.6rem] uppercase tracking-wider px-3 h-8 rounded-xl shadow-md"
          >
            Decline
          </Button>
        </>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={loading} className="text-gray-600 hover:bg-gray-100 font-black italic tracking-widest text-[0.6rem] h-8 rounded-xl">
            •••
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-[#1A1A1A] border border-white/15 text-white rounded-2xl shadow-2xl backdrop-blur-2xl min-w-[13rem] z-50 p-1.5 space-y-1">
          <DropdownMenuItem onClick={toggleVerification} className="focus:bg-white/10 focus:text-orange-500 font-black uppercase tracking-widest text-[0.65rem] py-3 px-4 rounded-xl cursor-pointer transition-colors">
            {isVerified ? 'Revoke Verification' : 'Grant Verification'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleStatus} className="focus:bg-white/10 focus:text-red-500 font-black uppercase tracking-widest text-[0.65rem] py-3 px-4 rounded-xl cursor-pointer transition-colors">
            {isActive ? 'Deactivate Account' : 'Activate Account'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
