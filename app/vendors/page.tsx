import { createClient } from '@/lib/supabase/server';
import { getVendors, getCuisineTypes, type VendorFilters as VendorFiltersType } from '@/lib/services/vendor-service';
import VendorGrid from '@/components/vendors/vendor-grid';
import VendorFilters from '@/components/vendors/vendor-filters';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function VendorsPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  // Parse filters
  const filters: VendorFiltersType = {
    cuisineType: typeof params.cuisineType === 'string' ? params.cuisineType : undefined,
    search: typeof params.search === 'string' ? params.search : undefined,
  };

  const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
  const limit = 12;

  const [vendorsResult, cuisineTypes] = await Promise.all([
    getVendors(supabase, filters, page, limit),
    getCuisineTypes(supabase),
  ]);

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-32">
      {/* Premium Hero Header for Vendors */}
      <div className="relative overflow-hidden bg-[#1A1A1A] py-10 sm:py-16 md:py-24">
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-orange-500/20 rounded-full blur-3xl -mr-48 -mt-48 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-red-500/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-8">
            <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
               <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></div>
               <span className="text-[0.55rem] sm:text-[0.65rem] font-black text-white uppercase tracking-[0.2em] sm:tracking-[0.3em] italic">Certified Neighborhood Chefs</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-[0.85] uppercase italic">
              MEET OUR <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                MASTER CHEFS
              </span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-xl text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed px-4">
              Discover the passionate homemakers and expert cooks bringing thousands of years of family recipes to your table.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-8 max-w-7xl -mt-6 sm:-mt-12 relative z-20">
        {/* Search & Organization Bar - Premium Style */}
        <div className="bg-white p-2 sm:p-3 rounded-2xl sm:rounded-[2.5rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15)] border border-gray-100 flex flex-col md:flex-row gap-2 items-center mb-8 sm:mb-12">
          <div className="flex-1 w-full relative group">
             <form action="/vendors" className="flex items-center w-full">
                <div className="w-12 h-12 flex items-center justify-center text-gray-400">
                  <span className="text-xl">🔍</span>
                </div>
                <Input
                  name="search"
                  type="search"
                  placeholder="Search for your favorite chef or cuisine..."
                  defaultValue={filters.search}
                  className="h-12 border-none shadow-none focus-visible:ring-0 text-gray-900 font-bold placeholder:text-gray-300 text-lg rounded-2xl bg-transparent"
                />
             </form>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 sm:gap-12">
          {/* Refined Sidebar */}
          <aside className="lg:w-80 space-y-8">
            <div className="sticky top-24">
              <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 mb-8">
                 <VendorFilters cuisineTypes={cuisineTypes} />
              </div>
              
              {/* Featured Promo - Premium Impact */}
              <div className="p-8 rounded-[2rem] bg-[#1A1A1A] text-white shadow-2xl relative overflow-hidden group border border-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <h4 className="text-xl font-black mb-3 flex items-center gap-2 uppercase italic tracking-tighter">
                  <Sparkles className="w-5 h-5 text-orange-500" />
                  Join as a Chef
                </h4>
                <p className="text-[0.65rem] text-gray-400 mb-6 font-black uppercase tracking-[0.1em] leading-relaxed">Share your family traditions. Build your neighborhood legacy.</p>
                <Button className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest border-none shadow-lg rounded-2xl h-14 transition-all hover:scale-105 active:scale-95 duration-300">
                  Enrol Today
                </Button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 space-y-10">
            <div className="flex items-center justify-between border-b-2 border-gray-50 pb-6">
              <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A1A] tracking-tighter uppercase italic flex items-center gap-4">
                Elite Kitchens
                <span className="text-xs sm:text-sm font-bold text-gray-400 border border-gray-100 px-3 py-1 rounded-xl">
                  {vendorsResult.total} REGISTERED
                </span>
              </h2>
            </div>

            {vendorsResult.vendors.length > 0 ? (
              <VendorGrid vendors={vendorsResult.vendors as any} />
            ) : (
              <div className="bg-white rounded-[3rem] p-24 text-center border-2 border-dashed border-gray-100">
                <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                   <span className="text-4xl text-gray-200">🔍</span>
                </div>
                <h3 className="text-2xl font-black text-[#1A1A1A] uppercase italic">Zero Matches found</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-4 max-w-sm mx-auto leading-relaxed">Explore different cuisines to discover our neighborhood's finest home kitchens.</p>
              </div>
            )}

            {/* Premium Pagination */}
            {(vendorsResult.totalPages || 0) > 1 && (
              <div className="mt-20 flex justify-center">
                <nav className="flex items-center gap-4 bg-white p-3 rounded-[2rem] shadow-xl border border-gray-100">
                  {page > 1 && (
                    <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl hover:bg-orange-600 hover:text-white transition-all duration-500" asChild>
                      <Link href={`/vendors?${new URLSearchParams({ ...params as Record<string, string>, page: (page - 1).toString() }).toString()}`}>
                        ←
                      </Link>
                    </Button>
                  )}
                  
                  <div className="px-6 text-[0.65rem] font-black text-[#1A1A1A] uppercase tracking-[0.4em]">
                    STATIONS <span className="text-orange-600 font-black">{page}</span> / {vendorsResult.totalPages}
                  </div>
                  
                  {page < (vendorsResult.totalPages || 0) && (
                    <Button variant="ghost" size="icon" className="w-12 h-12 rounded-2xl hover:bg-orange-600 hover:text-white transition-all duration-500" asChild>
                      <Link href={`/vendors?${new URLSearchParams({ ...params as Record<string, string>, page: (page + 1).toString() }).toString()}`}>
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
    </div>
  );
}
