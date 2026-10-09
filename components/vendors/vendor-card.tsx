import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Clock, Bike } from 'lucide-react';

interface VendorCardProps {
  vendor: {
    id: string;
    business_name: string;
    description: string | null;
    cuisine_types: string[] | null;
    rating: number | null;
    total_reviews: number | null;
    is_active: boolean;
  };
}

export default function VendorCard({ vendor }: VendorCardProps) {
  return (
    <Link href={`/vendors/${vendor.id}`} className="group block relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-600 rounded-[2rem] blur opacity-0 group-hover:opacity-10 transition duration-500"></div>
      
      <Card className="relative h-full border-none shadow-sm group-hover:shadow-2xl smooth-transition bg-white overflow-hidden rounded-[1.75rem]">
        {/* Restaurant Banner - Premium Style */}
        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
          <span className="text-7xl group-hover:scale-110 transition-transform duration-700 ease-out opacity-20 grayscale group-hover:grayscale-0 group-hover:opacity-100">👩‍🍳</span>
          
          {/* Status Overlay */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <div className="px-3 py-1.5 rounded-xl backdrop-blur-md bg-white/90 shadow-lg flex items-center gap-2 border border-white/20">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[0.65rem] font-black uppercase tracking-widest text-gray-900">Active Now</span>
            </div>
          </div>

          {/* Offer Badge - High End */}
          <div className="absolute bottom-4 left-4 bg-[#1A1A1A] text-white px-3 py-1.5 rounded-xl text-[0.65rem] font-black uppercase tracking-widest shadow-xl border border-white/10">
            20% Off Tiffins
          </div>
        </div>

        <CardContent className="p-5">
          <div className="flex flex-col gap-1 mb-4">
            <div className="flex items-center gap-1.5 text-[0.65rem] font-black uppercase tracking-[0.1em] text-orange-600 mb-0.5">
              <span>Verified Home Kitchen</span>
              <span className="w-1 h-1 bg-orange-600 rounded-full"></span>
              <span>Top Seller</span>
            </div>
            <h3 className="text-xl font-extrabold text-[#1A1A1A] line-clamp-1 group-hover:text-orange-600 transition-colors">
              {vendor.business_name}
            </h3>
            
            {/* Cuisine Tags - Premium */}
            {vendor.cuisine_types && vendor.cuisine_types.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {vendor.cuisine_types.slice(0, 2).map((type, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-gray-50 text-[0.6rem] font-bold text-gray-400 uppercase tracking-wider border border-gray-100 italic">
                    {type}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Rating and Info - Organized */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1 text-orange-600">
                  <Star className="w-3.5 h-3.5 fill-orange-600" />
                  <span className="text-sm font-black tracking-tighter">{vendor.rating?.toFixed(1) || '4.8'}</span>
                </div>
                <span className="text-[0.65rem] font-bold text-gray-300">
                  ({vendor.total_reviews || 124} reviews)
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                 <div className="flex items-center gap-1 text-gray-900 font-bold text-xs uppercase tracking-tight">
                   <Clock className="w-3 h-3 text-orange-500" />
                   30-40m
                 </div>
                 <span className="text-[0.6rem] font-black text-gray-300 uppercase tracking-widest leading-none mt-0.5">Delivery</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Bike className="w-4 h-4 text-green-600" />
              <span className="text-[0.65rem] font-black text-green-700 uppercase tracking-wider italic">Free Delivery</span>
            </div>
            <button className="text-[0.65rem] font-black uppercase tracking-widest text-[#1A1A1A] group-hover:text-orange-600 transition-colors flex items-center gap-1 group/btn">
              View Menu <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
