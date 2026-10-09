'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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

  const isActive = (path: string) => pathname === path;

  const getNavLinks = () => {
    const commonLinks = [
      { href: '/meals', label: 'Menu' },
      { href: '/vendors', label: 'Vendors' },
    ];

    if (!user) {
      return [
        ...commonLinks,
        { href: '/login', label: 'Login' },
        { href: '/register', label: 'Join Now' },
      ];
    }

    const roleLinks: Record<string, { href: string; label: string }[]> = {
      customer: [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/orders', label: 'Orders' },
        { href: '/subscriptions', label: 'Subscriptions' },
        { href: '/profile', label: 'Profile' },
      ],
      vendor: [
        { href: '/vendor-dashboard', label: 'Dashboard' },
        { href: '/menu-management', label: 'Menu' },
        { href: '/vendor-orders', label: 'Orders' },
        { href: '/analytics', label: 'Analytics' },
      ],
      delivery: [
        { href: '/delivery-dashboard', label: 'Dashboard' },
        { href: '/available-orders', label: 'Available Orders' },
        { href: '/active-deliveries', label: 'Active Deliveries' },
      ],
      admin: [
        { href: '/admin-dashboard', label: 'Dashboard' },
        { href: '/users', label: 'Users' },
        { href: '/vendors', label: 'Vendors' },
      ],
    };

    return [...commonLinks, ...(roleLinks[user.role] || [])];
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open Menu">
          <span className="text-xl">☰</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Navigation</DialogTitle>
        </DialogHeader>
        <nav className="flex flex-col space-y-2">
          {getNavLinks().map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {user && (
            <button
              type="button"
              onClick={async () => {
                setOpen(false);
                await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
                window.location.href = '/login';
              }}
              className="mt-4 w-full rounded-xl py-2.5 px-4 text-xs font-black uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-100 text-left transition-colors"
            >
              🚪 Logout
            </button>
          )}
        </nav>
      </DialogContent>
    </Dialog>
  );
}
