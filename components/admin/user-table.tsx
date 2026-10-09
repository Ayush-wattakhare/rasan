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
    switch(role) {
      case 'admin': return 'bg-red-500/10 text-red-600 border-red-100';
      case 'vendor': return 'bg-purple-500/10 text-purple-600 border-purple-100';
      case 'delivery': return 'bg-blue-500/10 text-blue-600 border-blue-100';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-100';
    }
  };

  return (
    <div className="overflow-x-auto space-y-4">
      {/* Bulk Operations Toolbar */}
      {selectedUserIds.length > 0 && (
        <div className="mx-6 md:mx-10 p-4 bg-[#1A1A1A] text-white rounded-2xl flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-xs font-black uppercase tracking-widest text-orange-400">
            {selectedUserIds.length} User(s) Selected
          </span>
          <div className="flex gap-3">
            <Button
              size="sm"
              onClick={() => handleBulkStatusChange(true)}
              className="bg-green-600 hover:bg-green-500 text-white font-black text-xs uppercase tracking-wider rounded-xl"
            >
              Activate Selected
            </Button>
            <Button
              size="sm"
              onClick={() => handleBulkStatusChange(false)}
              className="bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider rounded-xl"
            >
              Suspend Selected
            </Button>
          </div>
        </div>
      )}

      <Table className="border-separate border-spacing-y-4 px-6 md:px-10">
        <TableHeader>
          <TableRow className="border-none hover:bg-transparent">
            <TableHead className="w-12 text-center border-none">
              <input
                type="checkbox"
                checked={selectedUserIds.length === users.length && users.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
              />
            </TableHead>
            <TableHead className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-gray-400 border-none px-6">IDENTITY_NODE</TableHead>
            <TableHead className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-gray-400 border-none px-6">AUTH_ACCESS</TableHead>
            <TableHead className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-gray-400 border-none px-6">PERMISSION_LEVEL</TableHead>
            <TableHead className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-gray-400 border-none px-6">SEC_STATUS</TableHead>
            <TableHead className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-gray-400 border-none px-6">ONBOARDED</TableHead>
            <TableHead className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-gray-400 border-none px-6 text-right">PROTOCOL</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow className="hover:bg-transparent border-none">
              <TableCell colSpan={6} className="text-center py-32 border-none">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-300">
                    <UserIcon className="w-8 h-8" />
                  </div>
                  <p className="text-[0.7rem] font-black text-gray-400 uppercase tracking-[0.3em] italic">Zero population entities detected</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow 
                key={user.id} 
                onClick={() => router.push(`/admin-dashboard/users/${user.id}`)}
                className="group border-none bg-white rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(234,88,12,0.1)] transition-all duration-500 relative hover:z-20 focus-within:z-30 cursor-pointer"
              >
                <TableCell className="w-12 text-center border-none rounded-l-[3rem]" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={(e) => toggleSelectUser(user.id, e as any)}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                </TableCell>
                <TableCell className="px-6 py-6 border-none">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-900 group-hover:bg-[#1A1A1A] group-hover:text-white transition-all shadow-sm">
                         <Hash className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="text-sm font-black text-gray-900 uppercase italic tracking-tight mb-0.5">{user.name}</p>
                         <p className="text-[0.6rem] font-bold text-gray-400 tracking-widest uppercase">UUID: {user.id.slice(0, 8)}</p>
                      </div>
                   </div>
                </TableCell>
                
                <TableCell className="px-6 py-6 border-none">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                       <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-[0.75rem] font-black text-gray-800 uppercase italic leading-none">{user.email}</span>
                  </div>
                </TableCell>
                
                <TableCell className="px-6 py-6 border-none">
                  <Badge className={`text-[0.55rem] font-black uppercase tracking-widest px-4 h-6 border ${getRoleBadgeStyle(user.role)}`}>
                    {user.role}
                  </Badge>
                </TableCell>
                
                <TableCell className="px-6 py-6 border-none">
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                         <span className="text-[0.6rem] font-black uppercase tracking-widest text-gray-500">{user.is_active ? 'ACTIVE' : 'LOCKED'}</span>
                      </div>
                      {user.is_verified && (
                        <div className="flex items-center gap-1 text-blue-600">
                           <ShieldCheck className="w-3.5 h-3.5" />
                           <span className="text-[0.6rem] font-black uppercase tracking-widest">VERIFIED</span>
                        </div>
                      )}
                   </div>
                </TableCell>
                
                <TableCell className="px-6 py-6 border-none">
                   <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[0.65rem] font-bold uppercase tracking-tighter">{formatDate(user.created_at, 'PP')}</span>
                   </div>
                </TableCell>
                
                <TableCell className="px-6 py-6 border-none rounded-r-[3rem] text-right">
                    <VerificationActions 
                      userId={user.id} 
                      isVerified={user.is_verified} 
                      isActive={user.is_active} 
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
