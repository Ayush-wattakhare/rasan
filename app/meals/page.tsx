import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getMeals, getMealCategories, type MealFilters as MealFiltersType } from '@/lib/services/meal-service';
import type { MealType } from '@/types';
import MealGrid from '@/components/meals/meal-grid';
import HorizontalPreferences from '@/components/meals/horizontal-preferences';
import SearchInput from '@/components/meals/search-input';
import SortDropdown from '@/components/meals/sort-dropdown';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function MealsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  // Parse filters
  const filters: MealFiltersType = {
    category: typeof params.category === 'string' ? params.category : undefined,
    mealType: typeof params.mealType === 'string' ? params.mealType as MealType : undefined,
    isVegetarian: typeof params.isVegetarian === 'string' ? params.isVegetarian === 'true' : undefined,
    search: typeof params.search === 'string' ? params.search : undefined,
    sortBy: (typeof params.sortBy === 'string' ? params.sortBy : undefined) as MealFiltersType['sortBy'],
  };

  const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
  const limit = 12;

  const [mealsResult, categories] = await Promise.all([
    getMeals(supabase, filters, page, limit),
    getMealCategories(supabase),
  ]);

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-32">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-[#1A1A1A] py-10 sm:py-16 md:py-24">
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-orange-500/20 rounded-full blur-3xl -mr-32 sm:-mr-48 -mt-32 sm:-mt-48 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-red-500/10 rounded-full blur-3xl -ml-24 sm:-ml-32 -mb-24 sm:-mb-32"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-8">
            <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
               <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></div>
               <span className="text-[0.55rem] sm:text-[0.65rem] font-black text-white uppercase tracking-[0.2em] sm:tracking-[0.3em] italic">Hyperlocal Kitchens Active</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[0.85] uppercase italic">
              EXPLORE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                MASTER CHEFS
              </span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-xl text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed px-4">
              Authentic home-cooked excellence delivered from our neighborhood's most elite kitchens.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 max-w-7xl -mt-6 sm:-mt-12 relative z-20">
        {/* Search & Sort Bar */}
        <div className="bg-white p-2 sm:p-3 rounded-2xl sm:rounded-[2.5rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col sm:flex-row gap-2 sm:gap-4 items-center mb-6 sm:mb-10">
          <div className="flex-1 w-full">
            <Suspense fallback={<div className="h-14 bg-gray-50 rounded-2xl animate-pulse" />}>
              <SearchInput />
            </Suspense>
          </div>
          <div className="h-px w-full sm:h-10 sm:w-px bg-gray-100"></div>
          <div className="w-full sm:w-auto">
            <Suspense fallback={<div className="h-14 w-48 bg-gray-50 rounded-2xl animate-pulse" />}>
              <SortDropdown />
            </Suspense>
          </div>
        </div>

        {/* Horizontal Preferences (New Location) */}
        <HorizontalPreferences categories={categories} />

        {/* Main Grid Content */}
        <div className="space-y-6 sm:space-y-10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-gray-50 pb-4 sm:pb-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic flex flex-wrap items-center gap-2 sm:gap-4">
              Active Menus
              <span className="text-xs sm:text-sm font-bold text-gray-400 border border-gray-100 px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl">
                {mealsResult.total} AVAILABLE
              </span>
            </h2>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[0.6rem] sm:text-xs font-black text-orange-600 uppercase tracking-widest italic animate-pulse">
               <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" /> Freshly Prepared
            </div>
          </div>

          {mealsResult.meals.length > 0 ? (
            <MealGrid meals={mealsResult.meals as any} />
          ) : (
            <div className="bg-white rounded-[3rem] p-24 text-center border-2 border-dashed border-gray-100">
              <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                 <span className="text-4xl text-gray-200">🔍</span>
              </div>
              <h3 className="text-2xl font-black text-[#1A1A1A] uppercase italic">Zero Matches Detected</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-4 max-w-sm mx-auto leading-relaxed">Our chefs are busy preparing new recipes. Adjust your preference horizon to find available delicacies.</p>
              <Button variant="outline" className="mt-8 rounded-2xl h-12 px-8 font-black uppercase tracking-widest border-2 hover:bg-orange-50 border-gray-100" asChild>
                <Link href="/meals">Reset All Preferences</Link>
              </Button>
            </div>
          )}

          {/* Premium Pagination */}
          {(mealsResult.totalPages || 0) > 1 && (
            <div className="mt-20 flex justify-center">
              <nav className="flex items-center gap-4 bg-white p-3 rounded-[2rem] shadow-xl border border-gray-100 ring-1 ring-black/5">
                {page > 1 && (
                  <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl hover:bg-orange-600 hover:text-white transition-all duration-500" asChild>
                    <Link href={`/meals?${new URLSearchParams({ ...params as Record<string, string>, page: (page - 1).toString() }).toString()}`}>
                      ←
                    </Link>
                  </Button>
                )}
                
                <div className="px-6 text-[0.65rem] font-black text-[#1A1A1A] uppercase tracking-[0.4em]">
                  TRANSIT <span className="text-orange-600 font-black">{page}</span> / {mealsResult.totalPages}
                </div>
                
                {page < (mealsResult.totalPages || 0) && (
                  <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl hover:bg-orange-600 hover:text-white transition-all duration-500" asChild>
                    <Link href={`/meals?${new URLSearchParams({ ...params as Record<string, string>, page: (page + 1).toString() }).toString()}`}>
                      →
                    </Link>
                  </Button>
                )}
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
