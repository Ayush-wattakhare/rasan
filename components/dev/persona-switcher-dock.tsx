'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  User, 
  ChefHat, 
  Truck, 
  ShieldCheck, 
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  Play, 
  Loader2, 
  Check, 
  ExternalLink,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PersonaSwitcherDockProps {
  currentRole?: string | null;
  currentEmail?: string | null;
}

const PERSONAS = [
  {
    id: 'customer',
    role: 'customer',
    name: 'Demo Customer',
    subtitle: 'Pimpri Tiffin Subscriber',
    email: 'customer@rasan.com',
    password: 'customer123',
    icon: User,
    color: 'from-amber-500 to-orange-500',
    textColor: 'text-orange-500',
    badgeColor: 'bg-orange-50 text-orange-700 border-orange-200',
    defaultRoute: '/subscriptions',
  },
  {
    id: 'vendor',
    role: 'vendor',
    name: 'Chef Anita',
    subtitle: "Anita's Home Kitchen",
    email: 'vendor@rasan.com',
    password: 'vendor123',
    icon: ChefHat,
    color: 'from-orange-600 to-amber-600',
    textColor: 'text-amber-500',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    defaultRoute: '/vendor-dashboard',
  },
  {
    id: 'delivery',
    role: 'delivery',
    name: 'Rohan Sharma',
    subtitle: 'Hyperlocal Fleet Rider',
    email: 'delivery@rasan.com',
    password: 'delivery123',
    icon: Truck,
    color: 'from-blue-600 to-indigo-600',
    textColor: 'text-blue-400',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    defaultRoute: '/delivery-dashboard',
  },
  {
    id: 'admin',
    role: 'admin',
    name: 'Platform Admin',
    subtitle: 'Command & Settlements',
    email: 'admin@rasan.com',
    password: 'admin123',
    icon: ShieldCheck,
    color: 'from-emerald-600 to-teal-600',
    textColor: 'text-emerald-400',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    defaultRoute: '/admin-dashboard',
  },
];

export default function PersonaSwitcherDock({ currentRole, currentEmail }: PersonaSwitcherDockProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activePersona = PERSONAS.find(
    (p) => p.email.toLowerCase() === currentEmail?.toLowerCase() || p.role === currentRole
  ) || PERSONAS[0];

  const handleSwitchPersona = async (persona: typeof PERSONAS[0]) => {
    if (persona.email.toLowerCase() === currentEmail?.toLowerCase() && switchingId === null) {
      // Already this persona, just navigate to their primary route if not already there
      router.push(persona.defaultRoute);
      setIsOpen(false);
      return;
    }

    try {
      setSwitchingId(persona.id);
      const supabase = createClient();

      // Ensure demo account credentials exist
      await fetch('/api/admin/create-demo-users', { method: 'POST' }).catch(() => {});

      // Sign out current user first to clear cookies cleanly
      await supabase.auth.signOut();

      // Sign in as selected demo user
      const { data, error } = await supabase.auth.signInWithPassword({
        email: persona.email,
        password: persona.password,
      });

      if (error) {
        throw error;
      }

      setIsOpen(false);
      startTransition(() => {
        router.push(persona.defaultRoute);
        router.refresh();
      });
    } catch (err) {
      console.error('Error switching persona:', err);
      // Fallback redirect to login with prefill
      router.push(`/login?email=${encodeURIComponent(persona.email)}`);
    } finally {
      setSwitchingId(null);
    }
  };

  return (
    <aside 
      aria-label="Developer Persona Switcher" 
      className="fixed bottom-20 left-4 sm:bottom-6 sm:left-6 z-50 pointer-events-auto"
    >
      <div className="relative">
        {/* Expanded Drawer */}
        {isOpen && (
          <div className="absolute bottom-full left-0 mb-3 w-80 sm:w-96 bg-[#121212]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] ring-1 ring-white/10 animate-in slide-in-from-bottom-3 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Multi-Persona Switcher</h4>
                  <p className="text-[0.6rem] text-gray-400 font-medium">1-Click Live Role Emulation</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Persona Grid */}
            <div className="space-y-2">
              {PERSONAS.map((persona) => {
                const isCurrent = persona.email.toLowerCase() === currentEmail?.toLowerCase() || persona.role === currentRole;
                const isSwitching = switchingId === persona.id;
                const Icon = persona.icon;

                return (
                  <button
                    key={persona.id}
                    onClick={() => handleSwitchPersona(persona)}
                    disabled={switchingId !== null}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${
                      isCurrent
                        ? 'bg-white/10 border-orange-500/50 shadow-md ring-1 ring-orange-500/30'
                        : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 bg-gradient-to-br ${persona.color}`}>
                        {isSwitching ? (
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white truncate">{persona.name}</span>
                          {isCurrent && (
                            <span className="bg-emerald-500/20 text-emerald-400 text-[0.55rem] font-black px-1.5 py-0.5 rounded-md uppercase border border-emerald-500/30">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[0.65rem] text-gray-400 font-medium truncate">{persona.subtitle}</p>
                      </div>
                    </div>

                    <span className="text-[0.6rem] font-mono text-gray-500 font-semibold group-hover:text-gray-300 transition shrink-0 pl-2">
                      {persona.defaultRoute}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Order Lifecycle Simulator Action Bar */}
            <div className="mt-3 pt-3 border-t border-white/10">
              <Link
                href="/dev/order-simulator"
                onClick={() => setIsOpen(false)}
                className="w-full h-10 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white font-black text-[0.65rem] uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Launch 4-Party Order Simulator
              </Link>
            </div>
          </div>
        )}

        {/* Collapsed Trigger Capsule */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 bg-[#141414]/90 hover:bg-[#1C1C1C] backdrop-blur-xl border border-white/15 px-3.5 py-2 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.5)] ring-1 ring-white/10 transition-all cursor-pointer group"
        >
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white bg-gradient-to-br ${activePersona.color} shadow-xs`}>
            <activePersona.icon className="w-3.5 h-3.5" />
          </div>

          <div className="text-left hidden sm:block">
            <span className="text-[0.55rem] font-black uppercase tracking-widest text-gray-400 block -mb-0.5">
              Persona
            </span>
            <span className="text-xs font-black text-white group-hover:text-orange-400 transition">
              {activePersona.name}
            </span>
          </div>

          <span className="text-[0.65rem] font-bold text-gray-400 sm:hidden">
            {activePersona.name.split(' ')[0]}
          </span>

          <div className="text-gray-400 group-hover:text-white transition pl-1">
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </button>
      </div>
    </aside>
  );
}
