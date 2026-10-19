'use client';

import { MapPin, Rocket, Bell } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface CityUnavailableProps {
  /** City/area name detected from user GPS reverse-geocode */
  cityName?: string;
  /** Optional callback to allow user to preview Pune kitchens */
  onBrowsePreview?: () => void;
  /** Optional callback to pick a different delivery location */
  onChangeLocation?: () => void;
}

/**
 * Shown when the user's GPS location has no Rasan kitchens within
 * the service radius. Encourages them to sign up for launch notifications
 * and browse the Pune menus in read-only mode.
 */
export function CityUnavailable({ cityName, onBrowsePreview, onChangeLocation }: CityUnavailableProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // TODO: wire to a waitlist API / Supabase table
    console.info('[CityUnavailable] Waitlist signup:', email);
    setSubmitted(true);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-lg text-center space-y-8">
        {/* Animated map-pin icon */}
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 bg-orange-400 rounded-full animate-ping opacity-20" />
          <div className="relative w-24 h-24 bg-gradient-to-tr from-orange-500 via-orange-600 to-amber-500 rounded-3xl flex items-center justify-center shadow-xl shadow-orange-500/25">
            <MapPin className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-xs font-black uppercase tracking-widest">
            <Rocket className="w-3.5 h-3.5" />
            Coming Soon
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#1A1A1A] tracking-tight leading-tight">
            We&apos;re not in{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
              {cityName ?? 'your area'}
            </span>{' '}
            yet 🚚
          </h1>
          <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed font-medium">
            No Rasan home kitchen delivers within 10 km of this location yet. We currently deliver
            <strong> hyper-local ghar ka khana</strong> in Pune and are expanding fast.
          </p>
          {onChangeLocation && (
            <button
              type="button"
              onClick={onChangeLocation}
              className="text-sm font-bold text-orange-600 hover:text-orange-700 underline underline-offset-2"
            >
              Wrong location? Change it
            </button>
          )}
        </div>

        {/* Waitlist form */}
        {!submitted ? (
          <form onSubmit={handleNotify} className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
            <input
              id="waitlist-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 h-12 px-4 rounded-2xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm"
            />
            <button
              type="submit"
              className="h-12 px-6 bg-orange-600 hover:bg-orange-700 text-white text-sm font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-orange-600/20 transition-all duration-300 flex items-center gap-2"
            >
              <Bell className="w-4 h-4" />
              Notify Me
            </button>
          </form>
        ) : (
          <div className="inline-flex items-center gap-2 px-5 py-3 bg-green-50 border border-green-200 text-green-800 rounded-2xl text-sm font-bold">
            🎉 You&apos;re on the list! We&apos;ll notify you when Rasan reaches {cityName ?? 'your city'}.
          </div>
        )}

        {/* Browse Pune kitchens CTA */}
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
            Meanwhile, explore our Pune kitchens
          </p>
          {onBrowsePreview ? (
            <button
              onClick={onBrowsePreview}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              🍱 Browse Pune Menus (Preview Mode)
            </button>
          ) : (
            <Link
              href="/vendors?preview=pune"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors"
            >
              🍱 Browse Pune Menus (Read-only)
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
