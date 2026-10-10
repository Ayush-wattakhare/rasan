'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function CustomerSearch() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/meals?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleQuickFilter = (searchTerm: string) => {
    router.push(`/meals?search=${encodeURIComponent(searchTerm)}`);
  };

  const quickPills = [
    { label: 'Daily Thali', emoji: '🍛', search: 'Thali' },
    { label: 'Biryani & Rice', emoji: '🍲', search: 'Biryani' },
    { label: 'Homestyle Sabzi', emoji: '🥘', search: 'Sabzi' },
    { label: 'Roti & Paratha', emoji: '🫓', search: 'Paratha' },
    { label: 'Healthy & Diet', emoji: '🥗', search: 'Healthy' },
    { label: 'Pure Veg', emoji: '🌱', search: 'Veg' },
  ];

  return (
    <div className="space-y-3 mb-4">
      <form onSubmit={handleSearch}>
        <div className="bg-white p-1.5 md:p-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
          <div className="relative flex items-center">
            <div className="absolute left-3.5 h-8 w-8 flex items-center justify-center bg-orange-50 text-orange-600 rounded-xl">
              <Search className="w-4 h-4" />
            </div>
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search home chefs, dishes, or tiffins (e.g. Thali, Paneer, Biryani)..."
              className="pl-13 pr-24 h-11 md:h-12 border-none shadow-none focus-visible:ring-0 text-gray-900 font-semibold placeholder:text-gray-400 text-sm md:text-base rounded-xl bg-transparent"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              Search
            </button>
          </div>
        </div>
      </form>

      {/* Quick Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 pl-1">
          Popular:
        </span>
        {quickPills.map((pill) => (
          <button
            key={pill.label}
            type="button"
            onClick={() => handleQuickFilter(pill.search)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-orange-50 border border-gray-200/90 hover:border-orange-300 text-gray-700 hover:text-orange-700 font-medium shadow-xs transition-all shrink-0 cursor-pointer text-xs"
          >
            <span>{pill.emoji}</span>
            <span>{pill.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
