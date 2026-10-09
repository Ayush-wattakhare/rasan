'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  LifeBuoy, 
  Radio, 
  Store, 
  Truck,
  IndianRupee,
  Landmark,
  Bell,
  User 
} from 'lucide-react';

const links = [
  { href: '/admin-dashboard', label: 'COMMAND', icon: LayoutDashboard },
  { href: '/support-management', label: 'SUPPORT', icon: LifeBuoy },
  { href: '/live-ops', label: 'LIVE OPS', icon: Radio },
  { href: '/settlements', label: 'PAYOUTS', icon: Landmark },
  { href: '/vendor-management', label: 'VENDORS', icon: Store },
  { href: '/delivery-management', label: 'RIDERS', icon: Truck },
  { href: '/refunds-ledger', label: 'REFUNDS', icon: IndianRupee },
  { href: '/broadcasts', label: 'ALERTS', icon: Bell },
  { href: '/admin-profile', label: 'PROFILE', icon: User },
];

export default function AdminBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin-dashboard') return pathname === '/admin-dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-2 sm:px-4 pb-4 sm:pb-6 pointer-events-none flex justify-center">
      <nav className="bg-[#1A1A1A]/95 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] px-2 py-1.5 flex items-center gap-0.5 sm:gap-1 pointer-events-auto ring-1 ring-white/5 transition-all duration-300 max-w-full overflow-x-auto">
        {links.map((link) => {
          const active = isActive(link.href);
          const Icon = link.icon;
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative group flex flex-col items-center justify-center min-w-[3.4rem] sm:min-w-[4.4rem] py-1.5 sm:py-2 rounded-2xl transition-all duration-300 shrink-0 ${
                active ? 'text-orange-500 bg-white/5' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <div className="relative">
                <Icon 
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300 ${
                    active
                      ? 'scale-110 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)] text-orange-500'
                      : 'group-hover:scale-110 text-gray-400 group-hover:text-gray-200'
                  }`}
                />
                {active && (
                  <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full blur-[0.5px] animate-pulse" />
                )}
              </div>
              <span
                className={`text-[0.5rem] sm:text-[0.55rem] font-black uppercase tracking-wider mt-1 transition-all duration-300 ${
                  active ? 'opacity-100 text-white' : 'opacity-50 group-hover:opacity-85'
                }`}
              >
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
