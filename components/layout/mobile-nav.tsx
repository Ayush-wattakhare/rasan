'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  X, Home, Utensils, Store, Package, Repeat, User, LogOut, 
  LayoutDashboard, Menu, Landmark, Megaphone, Navigation, Zap, 
  Radio, Truck, IndianRupee, LifeBuoy 
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';

interface MobileNavProps {
  user?: {
    id: string;
    email: string;
    role: string;
  } | null;
}

export default function MobileNav({ user }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => { 
    setOpen(false); 
  }, [pathname]);

  const isActive = (path: string) => {
    if (
      path === '/dashboard' ||
      path === '/vendor-dashboard' ||
      path === '/delivery-dashboard' ||
      path === '/admin-dashboard'
    ) {
      return pathname === path;
    }
    return pathname === path || (path !== '/' && pathname.startsWith(path));
  };

  const getNavLinks = () => {
    if (!user) {
      return [
        { href: '/meals', label: 'Explore Meals', icon: Utensils },
        { href: '/vendors', label: 'Home Kitchens', icon: Store },
        { href: '/login', label: 'Login', icon: User },
        { href: '/register', label: 'Join Now', icon: LayoutDashboard },
      ];
    }

    if (user.role === 'vendor') {
      return [
        { href: '/vendor-dashboard', label: 'Kitchen Hub', icon: Home },
        { href: '/vendor-orders', label: 'Live Orders', icon: Package },
        { href: '/menu-management', label: 'Menu Management', icon: Utensils },
        { href: '/vendor-profile', label: 'Kitchen GPS & Profile', icon: Store },
        { href: '/payouts', label: 'Earnings & Payouts', icon: Landmark },
        { href: '/subscriber-broadcast', label: 'Customer Broadcast', icon: Megaphone },
      ];
    }

    if (user.role === 'delivery') {
      return [
        { href: '/delivery-dashboard', label: 'Pilot Radar', icon: Home },
        { href: '/active-deliveries', label: 'Active Delivery', icon: Navigation },
        { href: '/available-orders', label: 'Available Orders', icon: Package },
        { href: '/earnings', label: 'Earnings & Cashout', icon: Zap },
      ];
    }

    if (user.role === 'admin') {
      return [
        { href: '/admin-dashboard', label: 'Command Center', icon: LayoutDashboard },
        { href: '/live-ops', label: 'Live Operations', icon: Radio },
        { href: '/delivery-management', label: 'Delivery Riders', icon: Truck },
        { href: '/vendor-management', label: 'Vendor Kitchens', icon: Store },
        { href: '/settlements', label: 'Settlements', icon: Landmark },
        { href: '/refunds-ledger', label: 'Refunds Ledger', icon: IndianRupee },
        { href: '/support-management', label: 'Support Tickets', icon: LifeBuoy },
      ];
    }

    // Default: Customer
    return [
      { href: '/dashboard', label: 'Home Dashboard', icon: Home },
      { href: '/meals', label: 'Explore Meals', icon: Utensils },
      { href: '/vendors', label: 'Home Kitchens', icon: Store },
      { href: '/orders', label: 'Order History', icon: Package },
      { href: '/subscriptions', label: 'Tiffin Plans', icon: Repeat },
      { href: '/profile', label: 'Profile & Addresses', icon: User },
    ];
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Hamburger trigger with automatic toggle */}
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden w-10 h-10 rounded-xl cursor-pointer"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>

      {/* Bottom Sheet rendered directly in document.body via Portal */}
      <SheetContent
        side="bottom"
        className="z-[100] rounded-t-[2.5rem] bg-white max-h-[85vh] p-0 overflow-y-auto pb-safe border-none shadow-2xl focus:outline-none"
      >
        <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>

        {/* Pull handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Sheet header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="font-black text-[#1A1A1A] text-lg tracking-tight">Rasan</p>
            {user && <p className="text-xs text-gray-400 font-medium capitalize">{user.role} account</p>}
          </div>
          <SheetClose asChild>
            <button
              type="button"
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </SheetClose>
        </div>

        {/* Nav links */}
        <nav className="px-4 py-4 space-y-1">
          {getNavLinks().map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <SheetClose asChild key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold transition-all min-h-[52px] ${
                    active
                      ? 'bg-orange-50 text-orange-600 border border-orange-100'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-orange-500' : 'text-gray-400'}`} />
                  {link.label}
                  {active && <span className="ml-auto w-2 h-2 bg-orange-500 rounded-full" />}
                </Link>
              </SheetClose>
            );
          })}
        </nav>

        {/* Logout */}
        {user && (
          <div className="px-4 pb-8 pt-2 border-t border-gray-100 mt-2">
            <button
              type="button"
              onClick={async () => {
                setOpen(false);
                await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
                window.location.href = '/login';
              }}
              className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors min-h-[52px] cursor-pointer"
            >
              <LogOut className="w-5 h-5 text-red-400 shrink-0" />
              Logout
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
