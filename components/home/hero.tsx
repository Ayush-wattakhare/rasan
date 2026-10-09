'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LocationSelectorModal } from '@/components/location/location-selector-modal';
import {
  getStoredDeliveryLocation,
  RASAN_LOCATION_EVENT,
  AccurateLocationResult,
} from '@/lib/hooks/use-location';

export default function Hero() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Pimpri');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Initialize and synchronize location from storage or global events
  useEffect(() => {
    const stored = getStoredDeliveryLocation();
    if (stored?.details?.locality) {
      setLocation(stored.details.locality);
    } else {
      setLocation('Pimpri');
    }

    const handleLocationChange = (e: CustomEvent<AccurateLocationResult>) => {
      if (e.detail?.details?.locality) {
        setLocation(e.detail.details.locality);
      }
    };

    window.addEventListener(RASAN_LOCATION_EVENT as any, handleLocationChange as any);
    return () => {
      window.removeEventListener(RASAN_LOCATION_EVENT as any, handleLocationChange as any);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/meals?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <>
      <LocationSelectorModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={(loc) => {
          if (loc.details.locality) {
            setLocation(loc.details.locality);
          }
        }}
      />
      <section className="relative bg-[#1A1A1A] py-20 md:py-32 overflow-hidden isolate">
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse"></div>
          {/* Reduced bottom-left orb to prevent bleed into sections below */}
          <div className="absolute bottom-0 left-0 w-[150px] h-[150px] bg-red-600/5 rounded-full blur-[60px] -ml-20 -mb-20"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center text-center max-w-5xl mx-auto space-y-10">
            {/* Animated Badge */}
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
              </span>
              <span className="text-sm font-black text-orange-400 uppercase tracking-[0.2em]">Rasan Premium Home Tiffins</span>
            </div>

            {/* Epic Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none italic">
                FORGET MESS, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-orange-500">
                  EAT LIKE HOME.
                </span>
              </h1>
              <p className="text-lg md:text-2xl text-gray-400 max-w-3xl mx-auto font-medium leading-relaxed">
                Ditch the commercial taste. Indulge in authentic, healthy, and heart-crafted meals by India&apos;s finest home chefs.
              </p>
            </div>

            {/* High-Contrast Search Experience */}
            <div className="w-full max-w-3xl group">
               <form onSubmit={handleSearch} className="bg-white p-2 rounded-[2rem] shadow-[0_0_50px_-12px_rgba(255,107,0,0.3)] flex flex-col md:flex-row items-center gap-2 group-hover:shadow-[0_0_60px_-12px_rgba(255,107,0,0.5)] transition-all duration-500 overflow-hidden">
                  <button 
                    type="button"
                    onClick={() => setIsLocationModalOpen(true)}
                    className="flex items-center gap-3 px-6 py-3 border-r border-gray-100 min-w-[210px] hover:bg-orange-50/50 rounded-2xl transition-all cursor-pointer text-left group/loc"
                    title="Click to select exact location on map"
                  >
                     <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover/loc:bg-orange-600 group-hover/loc:text-white transition-colors shrink-0">
                       <MapPin className="w-4 h-4" />
                     </div>
                     <div className="min-w-0 flex-1">
                       <div className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                         Delivery To <span className="text-[0.55rem] text-orange-600 bg-orange-100/70 px-1 rounded font-black">MAP</span>
                       </div>
                       <div className="text-sm font-bold text-gray-900 flex items-center gap-1 leading-tight">
                         <span className="truncate max-w-[110px]">{location}</span>
                         <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover/loc:text-orange-600 transition-colors shrink-0" />
                       </div>
                     </div>
                  </button>
                
                <div className="flex-1 flex items-center px-4 py-3 relative">
                  <Search className="w-5 h-5 text-gray-300 mr-3 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search for biryani, thali or home chefs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent outline-none text-gray-900 font-bold placeholder:text-gray-300 text-lg"
                  />
                </div>

                <Button 
                  type="submit"
                  className="w-full md:w-auto px-10 h-14 rounded-2xl bg-[#1A1A1A] hover:bg-orange-600 text-white font-black uppercase tracking-widest transition-all duration-300"
                >
                  Find Food
                </Button>
             </form>
          </div>

          {/* Quick Category Chips */}
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { id: 'tiffin', label: 'Daily Tiffins', icon: '🍱' },
              { id: 'thali', label: 'Royal Thalis', icon: '🍛' },
              { id: 'subscriptions', label: 'Weekly Plans', icon: '📅' },
              { id: 'vendors', label: 'Local Chefs', icon: '👩‍🍳' }
            ].map((item) => (
              <Link
                key={item.id}
                href={item.id === 'vendors' ? '/vendors' : `/meals?category=${item.id}`}
                className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl text-white font-bold hover:bg-white/10 hover:border-orange-500/50 transition-all flex items-center gap-2.5"
              >
                <span>{item.icon}</span>
                <span className="text-xs uppercase tracking-[0.15em]">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Real-time Trust indicators */}
          <div className="grid grid-cols-3 gap-12 pt-12 border-t border-white/5 w-full max-w-2xl">
            <div className="text-center group">
              <div className="text-3xl font-black text-white group-hover:text-orange-500 transition-colors">500+</div>
              <div className="text-[0.65rem] font-black text-gray-500 uppercase tracking-widest mt-1">Home Kitchens</div>
            </div>
            <div className="text-center group">
              <div className="text-3xl font-black text-white group-hover:text-orange-500 transition-colors">50K+</div>
              <div className="text-[0.65rem] font-black text-gray-500 uppercase tracking-widest mt-1">Meals Served</div>
            </div>
            <div className="text-center group">
              <div className="text-3xl font-black text-white group-hover:text-orange-500 transition-colors">4.9/5</div>
              <div className="text-[0.65rem] font-black text-gray-500 uppercase tracking-widest mt-1">Avg Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Overlay */}
      <div className="absolute right-10 bottom-10 hidden xl:flex flex-col gap-3">
         <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3 max-w-[200px] animate-bounce-slow">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-xl">👩</div>
            <div className="flex flex-col">
               <span className="text-[0.6rem] font-black text-gray-400 uppercase tracking-tight">Recent Order</span>
               <span className="text-xs font-bold text-gray-900 leading-none">Priya from Mumbai</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
