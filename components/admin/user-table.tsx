'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import VerificationActions from './verification-actions';
import { formatDate } from '@/lib/utils/format';
import { User as UserIcon, Mail, Shield, Activity, ShieldCheck, Clock, Hash } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

interface UserTableProps {
  users: User[];
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/lib/hooks/use-toast';

export default function UserTable({ users }: UserTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const toggleSelectAll = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map((u) => u.id));
    }
  };

  const toggleSelectUser = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter((item) => item !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const handleBulkStatusChange = async (activate: boolean) => {
    if (selectedUserIds.length === 0) return;

    try {
      await Promise.all(
        selectedUserIds.map((userId) =>
          fetch(`/api/admin/users/${userId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: activate }),
          })
        )
      );

      toast({
        title: 'Bulk Protocol Executed',
        description: `Updated status for ${selectedUserIds.length} user(s).`,
      });
      setSelectedUserIds([]);
      router.refresh();
    } catch (err: any) {
      toast({
        title: 'Bulk Execution Failed',
        description: err.message || 'Could not update selected users',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/10 text-red-600 border-red-100';
      case 'vendor':
        return 'bg-purple-500/10 text-purple-600 border-purple-100';
      case 'delivery':
        return 'bg-blue-500/10 text-blue-600 border-blue-100';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-100';
    }
  };

  return (
    <div className="space-y-4 overflow-x-auto">
      {/* Bulk Operations Toolbar */}
      {selectedUserIds.length > 0 && (
        <div className="animate-in fade-in slide-in-from-top-2 mx-6 flex items-center justify-between rounded-2xl bg-[#1A1A1A] p-4 text-white shadow-xl duration-300 md:mx-10">
          <span className="text-xs font-black tracking-widest text-orange-400 uppercase">
            {selectedUserIds.length} User(s) Selected
          </span>
          <div className="flex gap-3">
            <Button
              size="sm"
              onClick={() => handleBulkStatusChange(true)}
              className="rounded-xl bg-green-600 text-xs font-black tracking-wider text-white uppercase hover:bg-green-500"
            >
              Activate Selected
            </Button>
            <Button
              size="sm"
              onClick={() => handleBulkStatusChange(false)}
              className="rounded-xl bg-red-600 text-xs font-black tracking-wider text-white uppercase hover:bg-red-500"
            >
              Suspend Selected
            </Button>
          </div>
        </div>
      )}

      <Table className="border-separate border-spacing-y-4 px-6 md:px-10">
        <TableHeader>
          <TableRow className="border-none hover:bg-transparent">
            <TableHead className="w-12 border-none text-center">
              <input
                type="checkbox"
                checked={selectedUserIds.length === users.length && users.length > 0}
                onChange={toggleSelectAll}
                className="h-4 w-4 cursor-pointer rounded text-orange-600 focus:ring-orange-500"
              />
            </TableHead>
            <TableHead className="border-none px-6 text-[0.65rem] font-black tracking-[0.2em] text-gray-400 uppercase">
              IDENTITY_NODE
            </TableHead>
            <TableHead className="border-none px-6 text-[0.65rem] font-black tracking-[0.2em] text-gray-400 uppercase">
              AUTH_ACCESS
            </TableHead>
            <TableHead className="border-none px-6 text-[0.65rem] font-black tracking-[0.2em] text-gray-400 uppercase">
              PERMISSION_LEVEL
            </TableHead>
            <TableHead className="border-none px-6 text-[0.65rem] font-black tracking-[0.2em] text-gray-400 uppercase">
              SEC_STATUS
            </TableHead>
            <TableHead className="border-none px-6 text-[0.65rem] font-black tracking-[0.2em] text-gray-400 uppercase">
              ONBOARDED
            </TableHead>
            <TableHead className="border-none px-6 text-right text-[0.65rem] font-black tracking-[0.2em] text-gray-400 uppercase">
              PROTOCOL
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow className="border-none hover:bg-transparent">
              <TableCell colSpan={6} className="border-none py-32 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-50 text-gray-300">
                    <UserIcon className="h-8 w-8" />
                  </div>
                  <p className="text-[0.7rem] font-black tracking-[0.3em] text-gray-400 uppercase italic">
                    Zero population entities detected
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow
                key={user.id}
                onClick={() => router.push(`/admin-dashboard/users/${user.id}`)}
                className="group relative cursor-pointer rounded-[3rem] border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 focus-within:z-30 hover:z-20 hover:shadow-[0_20px_50px_rgba(234,88,12,0.1)]"
              >
                <TableCell
                  className="w-12 rounded-l-[3rem] border-none text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={(e) => toggleSelectUser(user.id, e as any)}
                    className="h-4 w-4 cursor-pointer rounded text-orange-600 focus:ring-orange-500"
                  />
                </TableCell>
                <TableCell className="border-none px-6 py-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-900 shadow-sm transition-all group-hover:bg-[#1A1A1A] group-hover:text-white">
                      <Hash className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="mb-0.5 text-sm font-black tracking-tight text-gray-900 uppercase italic">
                        {user.name}
                      </p>
                      <p className="text-[0.6rem] font-bold tracking-widest text-gray-400 uppercase">
                        UUID: {user.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="border-none px-6 py-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <span className="text-[0.75rem] leading-none font-black text-gray-800 uppercase italic">
                      {user.email}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="border-none px-6 py-6">
                  <Badge
                    className={`h-6 border px-4 text-[0.55rem] font-black tracking-widest uppercase ${getRoleBadgeStyle(user.role)}`}
                  >
                    {user.role}
                  </Badge>
                </TableCell>

                <TableCell className="border-none px-6 py-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${user.is_active ? 'animate-pulse bg-green-500' : 'bg-gray-300'}`}
                      ></div>
                      <span className="text-[0.6rem] font-black tracking-widest text-gray-500 uppercase">
                        {user.is_active ? 'ACTIVE' : 'LOCKED'}
                      </span>
                    </div>
                    {user.is_verified && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span className="text-[0.6rem] font-black tracking-widest uppercase">
                          VERIFIED
                        </span>
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell className="border-none px-6 py-6">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-[0.65rem] font-bold tracking-tighter uppercase">
                      {formatDate(user.created_at, 'PP')}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="rounded-r-[3rem] border-none px-6 py-6 text-right">
                  <VerificationActions
                    userId={user.id}
                    isVerified={user.is_verified}
                    isActive={user.is_active}
                    role={user.role}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
