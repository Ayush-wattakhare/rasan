'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UserX, UserCheck, Shield, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Props {
  userId: string;
  isActive: boolean;
  currentRole: string;
}

const ROLES = ['customer', 'vendor', 'delivery', 'admin'];

export default function UserManagementActions({ userId, isActive, currentRole }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggleStatus = async () => {
    setLoading(true);
    try {
      await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (newRole: string) => {
    if (newRole === currentRole) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={toggleStatus}
        className={`text-[0.55rem] font-black uppercase tracking-widest rounded-lg h-7 px-2.5 ${
          isActive
            ? 'border-red-100 text-red-500 hover:bg-red-50'
            : 'border-green-100 text-green-600 hover:bg-green-50'
        }`}
      >
        {isActive ? <UserX className="w-3 h-3 mr-1" /> : <UserCheck className="w-3 h-3 mr-1" />}
        {isActive ? 'Deactivate' : 'Activate'}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={loading} className="text-[0.55rem] font-black uppercase tracking-widest rounded-lg h-7 px-2.5 border-gray-200">
            <Shield className="w-3 h-3 mr-1" /> Role <ChevronDown className="w-2.5 h-2.5 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuLabel className="text-[0.55rem] uppercase tracking-widest text-gray-400">Change Role</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {ROLES.map((role) => (
            <DropdownMenuItem
              key={role}
              onClick={() => changeRole(role)}
              className={`text-xs font-bold capitalize ${role === currentRole ? 'text-orange-600 bg-orange-50' : ''}`}
            >
              {role === currentRole && '✓ '}{role}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
