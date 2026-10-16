'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X, Home, Utensils, Store, Package, Repeat, User, LogOut, LayoutDashboard, Menu } from 'lucide-react';

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
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path);

  const getNavLinks = () => {
    const commonLinks = [
      { href: '/meals', label: 'Menu', icon: Utensils },
      { href: '/vendors', label: 'Vendors', icon: Store },
    ];

    if (!user) {
      return [
        ...commonLinks,
        { href: '/login', label: 'Login', icon: User },
        { href: '/register', label: 'Join Now', icon: LayoutDashboard },
      ];
    }

    const roleLinks: Record<string, { href: string; label: string; icon: any }[]> = {
      customer: [
        { href: '/dashboard', label: 'Dashboard', icon: Home },
        { href: '/orders', label: 'Orders', icon: Package },
        { href: '/subscriptions', label: 'Subscriptions', icon: Repeat },
        { href: '/profile', label: 'Profile', icon: User },
      ],
      vendor: [
        { href: '/vendor-dashboard', label: 'Dashboard', icon: Home },
        { href: '/menu-management', label: 'Menu', icon: Utensils },
        { href: '/vendor-orders', label: 'Orders', icon: Package },
      ],
      delivery: [
        { href: '/delivery-dashboard', label: 'Dashboard', icon: Home },
        { href: '/available-orders', label: 'Available Orders', icon: Package },
      ],
      admin: [
        { href: '/admin-dashboard', label: 'Dashboard', icon: Home },
      ],
    };

    return [...commonLinks, ...(roleLinks[user.role] || [])];
  };

  return (
    <>
      {/* Hamburger trigger */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden w-10 h-10 rounded-xl"
        aria-label="Open Menu"
        onClick={() => setOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Bottom Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white rounded-t-[2rem] shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '85vh', overflowY: 'auto' }}
      >
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
          <button
            onClick={() => setOpen(false)}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="px-4 py-4 space-y-1">
          {getNavLinks().map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
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
              className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors min-h-[52px]"
            >
              <LogOut className="w-5 h-5 text-red-400 shrink-0" />
              Logout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
