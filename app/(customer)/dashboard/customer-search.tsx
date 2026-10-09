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

  return (
    <form onSubmit={handleSearch}>
      <div className="bg-white p-3 rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] border border-gray-100 mb-20">
        <div className="relative group">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center bg-orange-50 rounded-[1.25rem] group-hover:bg-orange-600 group-hover:text-white transition-all duration-500">
            <Search className="w-5 h-5" />
          </div>
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for Master Chefs or signature dishes..."
            className="pl-20 h-16 border-none shadow-none focus-visible:ring-0 text-gray-900 font-bold placeholder:text-gray-300 text-2xl rounded-3xl bg-transparent"
          />
        </div>
      </div>
    </form>
  );
}
