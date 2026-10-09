'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface MealFiltersProps {
  categories: Array<{ id: string; name: string }>;
}

export default function MealFilters({ categories }: MealFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string | boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === '' || value === 'all' || value === false) {
      params.delete(key);
    } else {
      params.set(key, value.toString());
    }
    params.set('page', '1');
    router.push(`/meals?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/meals');
  };

  const hasFilters = Array.from(searchParams.keys()).some(
    (key) => !['page', 'limit', 'sortBy', 'search'].includes(key)
  );

  return (
    <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden" data-testid="meal-filters">
      <CardHeader className="pb-4 pt-8 px-6 bg-[#1A1A1A] text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/20 p-2 rounded-xl">
              <span className="text-xl">🛠️</span>
            </div>
            <CardTitle className="text-lg font-black tracking-tight">Preferences</CardTitle>
          </div>
          {hasFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="h-8 text-xs text-orange-400 hover:text-orange-300 hover:bg-white/5 font-bold uppercase tracking-widest"
            >
              Reset
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8 pt-8 px-6 pb-8">
        {/* Category Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Dietary Style</Label>
            <span className="text-[0.65rem] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">Explore</span>
          </div>
          <Select
            value={searchParams.get('category') || 'all'}
            onValueChange={(value) => handleFilterChange('category', value)}
          >
            <SelectTrigger className="h-12 border-gray-100 bg-gray-50/50 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
              <SelectItem value="all" className="rounded-xl">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id} className="rounded-xl">
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Meal Type Selection */}
        <div className="space-y-3">
          <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Time of Day</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'breakfast', label: 'Breakfast', icon: '🌅' },
              { id: 'lunch', label: 'Lunch', icon: '☀️' },
              { id: 'dinner', label: 'Dinner', icon: '🌙' },
              { id: 'snack', label: 'Snacks', icon: '🍿' }
            ].map((type) => {
              const isActive = searchParams.get('mealType') === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => handleFilterChange('mealType', isActive ? '' : type.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-300 ${
                    isActive 
                      ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white shadow-lg scale-95' 
                      : 'bg-white border-gray-100 text-gray-600 hover:border-orange-200 hover:bg-orange-50/30'
                  }`}
                >
                  <span className="text-xl mb-1">{type.icon}</span>
                  <span className="text-[0.65rem] font-black uppercase tracking-wider">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Veg Toggle - Premium Style */}
        <div className="pt-4 border-t border-gray-50">
          <div className={`flex items-center justify-between p-4 rounded-3xl border-2 transition-all duration-500 ${
            searchParams.get('isVegetarian') === 'true'
              ? 'bg-green-50 border-green-200 shadow-inner'
              : 'bg-gray-50/50 border-gray-100'
          }`}>
            <Label htmlFor="vegetarian" className="cursor-pointer flex items-center gap-3">
              <div className={`p-2 rounded-xl transition-colors ${
                searchParams.get('isVegetarian') === 'true' ? 'bg-green-500 text-white' : 'bg-white text-gray-400'
              }`}>
                <span className="text-sm">🌱</span>
              </div>
              <div className="flex flex-col">
                <span className={`text-sm font-black tracking-tight ${
                  searchParams.get('isVegetarian') === 'true' ? 'text-green-700' : 'text-gray-900'
                }`}>Vegetarian Only</span>
                <span className="text-[0.65rem] font-bold text-gray-400">Hide meat items</span>
              </div>
            </Label>
            <Switch
              id="vegetarian"
              checked={searchParams.get('isVegetarian') === 'true'}
              onCheckedChange={(checked) =>
                handleFilterChange('isVegetarian', checked)
              }
              className="data-[state=checked]:bg-green-500"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
