'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) {
        params.set('search', search);
      } else {
        params.delete('search');
      }
      params.set('page', '1');
      router.push(`/meals?${params.toString()}`);
    }, 500);

    return () => clearTimeout(timer);
  }, [search, router, searchParams]);

  return (
    <div className="relative w-full group">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
        <Search className="h-3.5 w-3.5 text-orange-600" />
      </div>
      <Input
        type="search"
        placeholder="Discover your next favorite meal..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="pl-16 h-14 border-none shadow-none focus-visible:ring-0 text-gray-900 font-medium placeholder:text-gray-400 text-lg rounded-2xl"
      />
    </div>
  );
}
