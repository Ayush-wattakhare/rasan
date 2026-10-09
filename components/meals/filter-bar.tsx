'use client';

import { useState } from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FilterBarProps {
  onFilterChange?: (filters: FilterState) => void;
}

interface FilterState {
  sortBy: string;
  isVeg: boolean | null;
  rating: number | null;
  priceRange: string | null;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'relevance',
    isVeg: null,
    rating: null,
    priceRange: null,
  });

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const toggleVeg = () => {
    const newValue = filters.isVeg === true ? null : true;
    updateFilter('isVeg', newValue);
  };

  return (
    <div className="sticky top-16 md:top-18 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 py-3 overflow-x-auto scrollbar-hide">
          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0 border-gray-200">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Sort
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => updateFilter('sortBy', 'relevance')}>
                Relevance
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('sortBy', 'rating')}>
                Rating: High to Low
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('sortBy', 'delivery_time')}>
                Delivery Time
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('sortBy', 'price_low')}>
                Cost: Low to High
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('sortBy', 'price_high')}>
                Cost: High to Low
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Veg/Non-veg Toggle */}
          <Button
            variant={filters.isVeg === true ? 'default' : 'outline'}
            size="sm"
            onClick={toggleVeg}
            className="shrink-0 border-gray-200"
          >
            <div className={`w-3 h-3 border-2 ${filters.isVeg ? 'border-white' : 'border-green-600'} bg-white flex items-center justify-center rounded-sm mr-2`}>
              <div className={`w-1.5 h-1.5 rounded-full ${filters.isVeg ? 'bg-white' : 'bg-green-600'}`}></div>
            </div>
            Veg Only
          </Button>

          {/* Rating Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={filters.rating ? 'default' : 'outline'} 
                size="sm" 
                className="shrink-0 border-gray-200"
              >
                Rating {filters.rating ? `${filters.rating}+` : ''}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => updateFilter('rating', null)}>
                Any Rating
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('rating', 4.5)}>
                4.5+ ⭐
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('rating', 4.0)}>
                4.0+ ⭐
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('rating', 3.5)}>
                3.5+ ⭐
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Price Range Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={filters.priceRange ? 'default' : 'outline'} 
                size="sm" 
                className="shrink-0 border-gray-200"
              >
                Price {filters.priceRange || ''}
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => updateFilter('priceRange', null)}>
                Any Price
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('priceRange', 'under-200')}>
                Under ₹200
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('priceRange', '200-500')}>
                ₹200 - ₹500
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateFilter('priceRange', 'above-500')}>
                Above ₹500
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Quick Filters */}
          <Button variant="outline" size="sm" className="shrink-0 border-gray-200">
            Fast Delivery
          </Button>
          <Button variant="outline" size="sm" className="shrink-0 border-gray-200">
            Offers
          </Button>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
