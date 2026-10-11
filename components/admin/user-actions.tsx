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

interface User {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  is_verified: boolean;
}

interface UserActionsProps {
  user: User;
}

// Goes through the admin API: profiles can't be changed from the browser.
async function updateUserStatus(
  userId: string,
  update: { is_active?: boolean; is_verified?: boolean }
): Promise<{ message: string } | null> {
  try {
    const res = await fetch(`/api/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    if (res.ok) return null;
    const data = await res.json().catch(() => ({}));
    return { message: data.error || 'Failed to update user' };
  } catch {
    return { message: 'Network error' };
  }
}

export default function UserActions({ user }: UserActionsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const toggleStatus = async () => {
    setLoading(true);
    const error = await updateUserStatus(user.id, { is_active: !user.is_active });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `User ${user.is_active ? 'deactivated' : 'activated'} successfully`,
      });
      router.refresh();
    }
    setLoading(false);
  };

  const toggleVerification = async () => {
    setLoading(true);
    const error = await updateUserStatus(user.id, { is_verified: !user.is_verified });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `User ${user.is_verified ? 'unverified' : 'verified'} successfully`,
      });
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={loading}>
          ⋮
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={toggleStatus}>
          {user.is_active ? 'Deactivate' : 'Activate'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleVerification}>
          {user.is_verified ? 'Unverify' : 'Verify'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
