'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  BarChart3,
  IndianRupee,
  User,
  Megaphone,
} from 'lucide-react';

const links = [
  { href: '/vendor-dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
  { href: '/subscriber-broadcast', label: 'CIRCLES', icon: Megaphone },
  { href: '/menu-management', label: 'MENU', icon: UtensilsCrossed },
  { href: '/vendor-orders', label: 'ORDERS', icon: ClipboardList },
  { href: '/analytics', label: 'IMPACT', icon: BarChart3 },
  { href: '/payouts', label: 'PAYOUTS', icon: IndianRupee },
  { href: '/vendor-profile', label: 'PROFILE', icon: User },
];

export default function VendorBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/vendor-dashboard') return pathname === '/vendor-dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pointer-events-none flex justify-center">
      <nav className="bg-[#1A1A1A]/90 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] px-2.5 py-1.5 flex items-center gap-0.5 sm:gap-1 pointer-events-auto ring-1 ring-white/5 transition-all duration-300">
        {links.map((link) => {
          const active = isActive(link.href);
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative group flex flex-col items-center justify-center min-w-[4rem] sm:min-w-[4.8rem] py-2 rounded-2xl transition-all duration-300 ${
                active ? 'text-orange-500' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ${
                    active
                      ? 'scale-110 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]'
                      : 'group-hover:scale-110 text-gray-400 group-hover:text-gray-200'
                  }`}
                />
                {active && (
                  <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-orange-500 rounded-full blur-[0.5px] animate-pulse" />
                )}
              </div>
              <span
                className={`text-[0.55rem] font-black uppercase tracking-wider mt-1.5 transition-all duration-300 ${
                  active ? 'opacity-100 text-white' : 'opacity-40 group-hover:opacity-75'
                }`}
              >
                {link.label}
              </span>

              {active && (
                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent rounded-2xl -z-10 animate-in fade-in duration-500" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
