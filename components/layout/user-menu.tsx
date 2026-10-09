'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { LogOut, Loader2, User, LayoutDashboard, Settings, ShoppingBag, Calendar, Users, Store, Bike } from 'lucide-react';

interface UserMenuProps {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // 1. Sign out on client Supabase instance
      const supabase = createClient();
      await supabase.auth.signOut().catch(() => {});

      // 2. Sign out on server to clear server-side cookies
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});

      // 3. Clear any cached user tokens in local storage
      if (typeof window !== 'undefined') {
        const keysToRemove = Object.keys(localStorage).filter(
          (k) => k.includes('supabase') || k.includes('auth') || k.includes('user')
        );
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      }

      // 4. Clean window reload / navigation to login
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
      window.location.href = '/login';
    }
  };

  const getDashboardLink = () => {
    const dashboardMap: Record<string, string> = {
      customer: '/dashboard',
      vendor: '/vendor-dashboard',
      delivery: '/delivery-dashboard',
      admin: '/admin-dashboard',
    };
    return dashboardMap[user.role] || '/dashboard';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="hidden md:flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-orange-50/50 transition-colors">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-xs font-black text-white shadow-xs">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div className="text-left leading-tight hidden lg:block">
            <span className="text-xs font-bold text-gray-900 block truncate max-w-[100px]">
              {user.email.split('@')[0]}
            </span>
            <span className="text-[0.6rem] font-bold text-orange-600 uppercase tracking-widest block">
              {user.role}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-xl border border-gray-100 bg-white">
        <DropdownMenuLabel className="p-3 bg-gray-50/80 rounded-xl mb-1">
          <div className="flex flex-col space-y-0.5">
            <p className="text-xs font-black text-gray-900 truncate">{user.email}</p>
            <p className="text-[0.65rem] text-orange-600 font-bold uppercase tracking-wider">
              {user.role} Account
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="my-1" />
        
        <DropdownMenuItem asChild className="rounded-xl cursor-pointer py-2 text-xs font-bold">
          <Link href={getDashboardLink()} className="flex items-center gap-2">
            <LayoutDashboard className="w-3.5 h-3.5 text-gray-400" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild className="rounded-xl cursor-pointer py-2 text-xs font-bold">
          <Link href="/profile" className="flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-gray-400" />
            Profile Settings
          </Link>
        </DropdownMenuItem>

        {user.role === 'customer' && (
          <>
            <DropdownMenuItem asChild className="rounded-xl cursor-pointer py-2 text-xs font-bold">
              <Link href="/orders" className="flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
                My Orders
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl cursor-pointer py-2 text-xs font-bold">
              <Link href="/subscriptions" className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                Subscriptions
              </Link>
            </DropdownMenuItem>
          </>
        )}

        {user.role === 'admin' && (
          <>
            <DropdownMenuItem asChild className="rounded-xl cursor-pointer py-2 text-xs font-bold">
              <Link href="/vendor-management" className="flex items-center gap-2">
                <Store className="w-3.5 h-3.5 text-gray-400" />
                Vendor Management
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl cursor-pointer py-2 text-xs font-bold">
              <Link href="/delivery-management" className="flex items-center gap-2">
                <Bike className="w-3.5 h-3.5 text-gray-400" />
                Delivery Partners
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl cursor-pointer py-2 text-xs font-bold">
              <Link href="/user-management" className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                User Management
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator className="my-1" />
        
        <DropdownMenuItem
          onClick={() => {
            if (!isLoggingOut) handleLogout();
          }}
          className="rounded-xl cursor-pointer py-2.5 text-xs font-black text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 flex items-center justify-between transition-colors"
        >
          <span className="flex items-center gap-2">
            {isLoggingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
            {isLoggingOut ? 'Logging Out...' : 'Logout'}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
