'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SortDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get('sortBy') || 'default';

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'default') {
      params.delete('sortBy');
    } else {
      params.set('sortBy', value);
    }
    params.set('page', '1');
    router.push(`/meals?${params.toString()}`);
  };

  return (
    <div className="flex items-center px-4">
      <span className="text-xs font-black uppercase tracking-widest text-gray-400 mr-3 hidden lg:block">Sort By</span>
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-full sm:w-[200px] h-14 border-none shadow-none focus:ring-0 text-gray-900 font-bold bg-transparent">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
          <SelectItem value="default" className="rounded-xl">⚡ Relevance</SelectItem>
          <SelectItem value="price_asc" className="rounded-xl">💰 Price: Low to High</SelectItem>
          <SelectItem value="price_desc" className="rounded-xl">💎 Price: High to Low</SelectItem>
          <SelectItem value="rating" className="rounded-xl">⭐ Top Rated</SelectItem>
          <SelectItem value="popularity" className="rounded-xl">🔥 Most Popular</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
