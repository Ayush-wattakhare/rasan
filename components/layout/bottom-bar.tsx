'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Package, Repeat, ShoppingBag, User, Sparkles, ClipboardList, BarChart3, Menu } from 'lucide-react';
import { useCart } from '@/lib/hooks/use-cart';

interface BottomBarProps {
  userRole?: string;
}

export default function BottomBar({ userRole }: BottomBarProps) {
  const pathname = usePathname();
  const { cart } = useCart();
  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    if (path !== '/dashboard' && pathname.startsWith(path)) return true;
    return false;
  };

  const customerNav = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/meals', icon: Search, label: 'Explore' },
    { href: '/orders', icon: Package, label: 'Tracking' },
    { href: '/subscriptions', icon: Repeat, label: 'Plan' },
    { href: '/cart', icon: ShoppingBag, label: 'Bag', badge: itemCount },
  ];

  if (userRole !== 'customer') return null;

  const navItems = customerNav;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-8 pointer-events-none flex justify-center">
      <nav className="bg-[#1A1A1A]/85 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] px-3 py-2 flex items-center gap-1 pointer-events-auto ring-1 ring-white/5 transition-all duration-500 hover:bg-[#1A1A1A]/90 hover:shadow-[0_30px_70px_-12px_rgba(0,0,0,0.5)]">
        {navItems.map((item: any) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative group flex flex-col items-center justify-center min-w-[5rem] py-2.5 rounded-3xl transition-all duration-500 ${
                active ? 'text-orange-500' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-all duration-500 ${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]' : 'group-hover:scale-110 text-gray-500 group-hover:text-gray-300'}`} />
                {'badge' in item && item.badge && item.badge > 0 && (
                  <span className="absolute -top-2.5 -right-2.5 bg-orange-600 text-white text-[0.55rem] font-black rounded-full h-4.5 w-4.5 flex items-center justify-center border-2 border-[#1A1A1A] shadow-lg animate-in zoom-in duration-300">
                    {item.badge}
                  </span>
                )}
                {active && (
                   <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-orange-500 rounded-full blur-[1px] animate-pulse"></span>
                )}
              </div>
              <span className={`text-[0.55rem] font-black uppercase tracking-[0.15em] mt-2 transition-all duration-500 ${active ? 'opacity-100' : 'opacity-40 group-hover:opacity-75'}`}>
                {item.label}
              </span>
              
              {active && (
                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent rounded-3xl -z-10 animate-in fade-in duration-700"></div>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
