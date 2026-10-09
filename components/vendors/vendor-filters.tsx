'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VendorFiltersProps {
  cuisineTypes: string[];
}

export default function VendorFilters({ cuisineTypes }: VendorFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === '' || value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set('page', '1');
    router.push(`/vendors?${params.toString()}`);
  };

  return (
    <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
      <CardHeader className="pb-4 pt-8 px-6 bg-[#1A1A1A] text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/20 p-2 rounded-xl">
              <span className="text-xl">👩‍🍳</span>
            </div>
            <CardTitle className="text-lg font-black tracking-tight">Chef Filters</CardTitle>
          </div>
          {searchParams.toString() !== '' && (
            <Button 
               variant="ghost" 
               size="sm" 
               onClick={() => router.push('/vendors')}
               className="h-8 text-xs text-orange-400 hover:text-orange-300 font-bold uppercase tracking-widest"
            >
              Reset
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8 pt-8 px-6 pb-8">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Cuisine Style</Label>
          </div>
          <Select
            value={searchParams.get('cuisineType') || 'all'}
            onValueChange={(value) => handleFilterChange('cuisineType', value)}
          >
            <SelectTrigger className="h-12 border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all">
              <SelectValue placeholder="All Cuisines" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
              <SelectItem value="all" className="rounded-xl">Global Flavors</SelectItem>
              {cuisineTypes.map((type) => (
                <SelectItem key={type} value={type} className="rounded-xl">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Tags */}
        <div className="space-y-3">
          <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Popular Filters</Label>
          <div className="flex flex-wrap gap-2">
            {['Top Rated', 'Free Delivery', 'New Arrival', 'Budget Friendly'].map(tag => (
              <button key={tag} className="px-3 py-1.5 rounded-xl border border-gray-100 text-[0.65rem] font-bold text-gray-500 hover:border-orange-200 hover:bg-orange-50 transition-all uppercase tracking-wider">
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-50">
           <div className="p-4 rounded-3xl bg-orange-50/50 border border-orange-100/50">
              <p className="text-[0.65rem] font-black text-orange-600 uppercase tracking-[0.2em] mb-1">Coming Soon</p>
              <h5 className="text-sm font-bold text-gray-900 leading-tight">Live Kitchen Stream</h5>
              <p className="text-[0.65rem] text-gray-500 mt-1">Watch your meal being prepared fresh!</p>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
