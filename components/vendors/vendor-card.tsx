import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Star, MapPin } from 'lucide-react';
import { formatDistance } from '@/lib/location/nearby';

interface VendorCardProps {
  vendor: {
    id: string;
    business_name: string;
    description: string | null;
    /** vendors.cuisine (text[]). */
    cuisine: string[] | null;
    rating: number | null;
    total_orders?: number | null;
    is_active: boolean;
    /** Distance from the customer's delivery location, when known. */
    distance_km?: number | null;
  };
}

/** Only real data: no invented offers, delivery times or review counts. */
export default function VendorCard({ vendor }: VendorCardProps) {
  const rating = Number(vendor.rating) || 0;
  const orders = Number(vendor.total_orders) || 0;
  const cuisines = Array.isArray(vendor.cuisine) ? vendor.cuisine : [];
  const hasDistance = vendor.distance_km != null && Number.isFinite(Number(vendor.distance_km));

  return (
    <Link href={`/vendors/${vendor.id}`} className="group block relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-600 rounded-[2rem] blur opacity-0 group-hover:opacity-10 transition duration-500"></div>

      <Card className="relative h-full border-none shadow-sm group-hover:shadow-2xl smooth-transition bg-white overflow-hidden rounded-[1.75rem]">
        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
          <span
            aria-hidden="true"
            className="text-7xl group-hover:scale-110 transition-transform duration-700 ease-out opacity-20 grayscale group-hover:grayscale-0 group-hover:opacity-100"
          >
            👩‍🍳
          </span>

          {hasDistance && (
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl backdrop-blur-md bg-white/90 shadow-lg flex items-center gap-1.5 border border-white/20">
              <MapPin className="w-3.5 h-3.5 text-orange-600" aria-hidden="true" />
              <span className="text-[0.65rem] font-black uppercase tracking-widest text-gray-900">
                {formatDistance(Number(vendor.distance_km))}
              </span>
            </div>
          )}
        </div>

        <CardContent className="p-5">
          <div className="flex flex-col gap-1 mb-4">
            <div className="text-[0.65rem] font-black uppercase tracking-[0.1em] text-orange-600 mb-0.5">
              Home Kitchen
            </div>
            <h3 className="text-xl font-extrabold text-[#1A1A1A] line-clamp-1 group-hover:text-orange-600 transition-colors">
              {vendor.business_name}
            </h3>

            {cuisines.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {cuisines.slice(0, 2).map((type, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-gray-50 text-[0.6rem] font-bold text-gray-500 uppercase tracking-wider border border-gray-100 italic">
                    {type}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
            <div className="flex items-center gap-1 text-orange-600">
              <Star className="w-3.5 h-3.5 fill-orange-600" aria-hidden="true" />
              <span className="text-sm font-black tracking-tighter">{rating > 0 ? rating.toFixed(1) : 'New'}</span>
            </div>
            {orders > 0 && (
              <span className="text-[0.65rem] font-bold text-gray-400">
                {orders} order{orders === 1 ? '' : 's'} delivered
              </span>
            )}
          </div>

          {/* A span, not a button: the whole card is already a link. */}
          <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
            <span className="text-[0.65rem] font-black uppercase tracking-widest text-[#1A1A1A] group-hover:text-orange-600 transition-colors flex items-center gap-1 group/btn">
              View Menu <span aria-hidden="true" className="group-hover/btn:translate-x-1 transition-transform">→</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
