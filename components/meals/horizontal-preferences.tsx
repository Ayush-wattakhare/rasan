'use client';

import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Coffee, Sun, Moon, Popcorn, Filter, Loader2 } from 'lucide-react';

interface HorizontalPreferencesProps {
  categories: Array<{ id: string; name: string }>;
}

export default function HorizontalPreferences({ categories }: HorizontalPreferencesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (key: string, value: string | boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === '' || value === 'all' || value === false) {
      params.delete(key);
    } else {
      params.set(key, value.toString());
    }
    params.set('page', '1');
    startTransition(() => {
      router.push(`/meals?${params.toString()}`, { scroll: false });
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      router.push('/meals', { scroll: false });
    });
  };

  const hasFilters = Array.from(searchParams.keys()).some(
    (key) => !['page', 'limit', 'sortBy', 'search'].includes(key)
  );

  return (
    <div className={`bg-white rounded-xl sm:rounded-[2rem] border border-gray-100 p-3 sm:p-6 shadow-sm sm:shadow-xl mb-6 sm:mb-12 relative overflow-hidden group transition-opacity duration-200 ${isPending ? 'opacity-70' : 'opacity-100'}`}>
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-colors duration-700 pointer-events-none"></div>
      
      <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 sm:gap-8 justify-between relative z-10">
        {/* Section Title */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-[1rem] sm:rounded-[1.25rem] bg-[#1A1A1A] flex items-center justify-center text-white shadow-xl">
             {isPending ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-orange-500" /> : <Filter className="w-4 h-4 sm:w-5 sm:h-5" />}
          </div>
          <div>
            <h3 className="text-base sm:text-xl font-black text-[#1A1A1A] tracking-tighter uppercase italic leading-none">Preferences</h3>
            <p className="text-[0.55rem] sm:text-[0.6rem] font-bold text-gray-400 uppercase tracking-widest mt-0.5 sm:mt-1">Instant taste horizon</p>
          </div>
          {hasFilters && (
            <Button 
               variant="ghost" 
               size="sm" 
               onClick={clearFilters}
               className="text-[0.6rem] sm:text-[0.65rem] font-black uppercase tracking-widest text-orange-600 hover:text-orange-700 hover:bg-orange-50/50 rounded-xl h-7 sm:h-8 px-2 sm:px-3 ml-1 sm:ml-2"
            >
              Reset
            </Button>
          )}
        </div>

        {/* Filters Controls Grid */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 w-full xl:w-auto">
          {/* Meal Slot Segmented Control */}
          <div className="flex items-center bg-gray-50/80 p-1 rounded-xl sm:rounded-2xl border border-gray-100/80 overflow-x-auto max-w-full">
            {[
              { id: 'all', label: 'All', icon: null },
              { id: 'breakfast', label: 'Morning', icon: Coffee },
              { id: 'lunch', label: 'Noon', icon: Sun },
              { id: 'dinner', label: 'Night', icon: Moon },
              { id: 'snack', label: 'Snack', icon: Popcorn },
            ].map((slot) => {
              const Icon = slot.icon;
              const isSelected = (searchParams.get('mealSlot') || 'all') === slot.id;
              
              return (
                <button
                  key={slot.id}
                  onClick={() => handleFilterChange('mealSlot', slot.id)}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-black text-[0.6rem] sm:text-[0.65rem] uppercase tracking-wider transition-all duration-300 shrink-0 cursor-pointer ${
                    isSelected 
                      ? 'bg-[#1A1A1A] text-white shadow-md shadow-black/10 scale-100' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  {Icon && <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isSelected ? 'text-orange-500' : 'text-gray-400'}`} />}
                  <span>{slot.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Dietary Toggles */}
          <div className="flex items-center gap-2 sm:gap-3 bg-gray-50/80 p-1.5 px-3 rounded-xl sm:rounded-2xl border border-gray-100/80">
            {/* Pure Veg Toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="pref-pure-veg"
                checked={searchParams.get('isVeg') === 'true'}
                onCheckedChange={(checked) => handleFilterChange('isVeg', checked)}
                className="data-[state=checked]:bg-emerald-600 scale-75 sm:scale-90"
              />
              <Label htmlFor="pref-pure-veg" className="text-[0.6rem] sm:text-[0.65rem] font-black uppercase tracking-wider text-gray-700 cursor-pointer select-none">
                Pure Veg
              </Label>
            </div>

            <div className="w-[1px] h-3 sm:h-4 bg-gray-200"></div>

            {/* Jain Toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="pref-jain"
                checked={searchParams.get('isJain') === 'true'}
                onCheckedChange={(checked) => handleFilterChange('isJain', checked)}
                className="data-[state=checked]:bg-green-700 scale-75 sm:scale-90"
              />
              <Label htmlFor="pref-jain" className="text-[0.6rem] sm:text-[0.65rem] font-black uppercase tracking-wider text-gray-700 cursor-pointer select-none">
                Jain
              </Label>
            </div>
          </div>

          {/* Cuisine Select Dropdown */}
          <div className="min-w-[110px] sm:min-w-[130px] flex-1 sm:flex-initial">
             <Select
                value={searchParams.get('cuisine') || 'all'}
                onValueChange={(value) => handleFilterChange('cuisine', value)}
             >
                <SelectTrigger className="h-9 sm:h-11 rounded-xl sm:rounded-2xl border-gray-100 bg-gray-50/80 text-[0.6rem] sm:text-[0.65rem] font-black uppercase tracking-wider focus:ring-orange-500/20">
                   <SelectValue placeholder="Cuisine" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                   <SelectItem value="all" className="text-xs font-bold uppercase tracking-wider">All Cuisines</SelectItem>
                   <SelectItem value="North Indian" className="text-xs font-bold uppercase tracking-wider">North Indian</SelectItem>
                   <SelectItem value="South Indian" className="text-xs font-bold uppercase tracking-wider">South Indian</SelectItem>
                   <SelectItem value="Maharashtrian" className="text-xs font-bold uppercase tracking-wider">Maharashtrian</SelectItem>
                   <SelectItem value="Gujarati" className="text-xs font-bold uppercase tracking-wider">Gujarati</SelectItem>
                   <SelectItem value="Bengali" className="text-xs font-bold uppercase tracking-wider">Bengali</SelectItem>
                </SelectContent>
             </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
