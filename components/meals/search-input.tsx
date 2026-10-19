'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const [search, setSearch] = useState(urlSearch);
  // True only while the user is typing; URL changes from elsewhere (paging,
  // Back, Reset) must not trigger a push or reset the page.
  const editingRef = useRef(false);

  // Keep the box in sync when the URL changes from outside (Back, Reset links).
  useEffect(() => {
    if (!editingRef.current) setSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    if (!editingRef.current) return;
    const timer = setTimeout(() => {
      editingRef.current = false;
      const next = search.trim();
      if (next === urlSearch) return;
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set('search', next);
      else params.delete('search');
      // A new search starts from the first page.
      params.delete('page');
      const qs = params.toString();
      router.replace(qs ? `/meals?${qs}` : '/meals', { scroll: false });
    }, 500);

    return () => clearTimeout(timer);
  }, [search, urlSearch, router, searchParams]);

  return (
    <div className="relative w-full group">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
        <Search className="h-3.5 w-3.5 text-orange-600" aria-hidden="true" />
      </div>
      <Input
        type="search"
        aria-label="Search meals"
        placeholder="Discover your next favorite meal..."
        value={search}
        onChange={(e) => {
          editingRef.current = true;
          setSearch(e.target.value);
        }}
        className="pl-16 h-14 border-none shadow-none focus-visible:ring-0 text-gray-900 font-medium placeholder:text-gray-400 text-lg rounded-2xl"
      />
    </div>
  );
}
