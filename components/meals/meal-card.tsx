'use client';

import Link from 'next/link';
import Image from 'next/image';
import { memo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/format';
import { Star, Clock, Check, Plus } from 'lucide-react';
import { useCart } from '@/lib/hooks/use-cart';
import { useToast } from '@/lib/hooks/use-toast';

interface MealCardProps {
  meal: {
    id: string;
    name: string;
    description?: string;
    price: number;
    image_url: string | null;
    is_vegetarian?: boolean;
    is_veg?: boolean;
    rating: number | null;
    stock: number | null;
    vendor_id?: string;
    vendors?: {
      id?: string;
      business_name: string;
    };
  };
}

function MealCard({ meal }: MealCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [isAdded, setIsAdded] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (meal.stock === 0) return;

    try {
      const vendorId = meal.vendor_id || meal.vendors?.id || 'default_vendor';
      addItem({
        meal_id: meal.id,
        vendor_id: vendorId,
        name: meal.name,
        price: meal.price,
        quantity: 1,
        image_url: meal.image_url || undefined,
        is_veg: meal.is_vegetarian ?? (meal as any).is_veg ?? true,
        subscription_type: 'one-time',
        delivery_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        delivery_time: '12:30 PM',
      });

      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 1400);

      toast({
        title: 'Added to Bag! 🍱',
        description: `${meal.name} is now in your cart. You can select your lunch break slot in your bag.`,
      });
    } catch (error: any) {
      toast({
        title: 'Different Kitchen',
        description: error?.message || 'You can only order from one home kitchen at a time.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Link href={`/meals/${meal.id}`} className="group block relative" data-testid="meal-card">
      <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-600 rounded-[1.5rem] sm:rounded-[2rem] blur opacity-0 group-hover:opacity-10 transition duration-500"></div>
      
      <Card className="relative overflow-hidden border-none shadow-sm group-hover:shadow-xl smooth-transition h-full bg-white rounded-[1.1rem] sm:rounded-[1.5rem]">
        {/* Image Area - Scaled Down */}
        <div className="relative h-32 sm:h-40 md:h-44 w-full overflow-hidden">
          {meal.image_url ? (
            <Image
              src={meal.image_url}
              alt={meal.name}
              fill
              unoptimized
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
              <div className="text-4xl sm:text-6xl group-hover:scale-110 transition-transform duration-500 grayscale group-hover:grayscale-0">🍱</div>
            </div>
          )}
          
          {/* Veg Indicator */}
          <div className="absolute top-2.5 left-2.5">
            <div className={`p-1 sm:p-1.5 rounded-lg backdrop-blur-md shadow-lg border border-white/20 flex items-center justify-center ${meal.is_vegetarian ? 'bg-green-500/90' : 'bg-red-500/90'}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
            </div>
          </div>

          {/* Stock Badge */}
          {meal.stock !== null && meal.stock !== undefined && meal.stock <= 10 && (
            <div className={`absolute top-2.5 left-10 sm:left-11 px-2 py-0.5 rounded-lg text-[0.55rem] font-black uppercase tracking-wider backdrop-blur-md shadow-md border border-white/20 ${
              meal.stock === 0
                ? 'bg-red-600/95 text-white'
                : meal.stock <= 5
                ? 'bg-amber-500/95 text-white'
                : 'bg-black/70 text-white'
            }`}>
              {meal.stock === 0 ? '🚫 Sold Out' : meal.stock <= 5 ? `🔥 Only ${meal.stock} left!` : `${meal.stock} left`}
            </div>
          )}

          {/* Quick Like */}
          <div className="absolute top-2.5 right-2.5 bg-white/80 backdrop-blur-md p-1.5 rounded-lg shadow-sm group-hover:scale-110 transition-transform cursor-pointer">
             <span className="text-sm">🤍</span>
          </div>

          {/* Floating Performance Data */}
          <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
            <div className="bg-[#1A1A1A]/90 backdrop-blur-md text-white px-2 py-0.5 sm:py-1 rounded-lg flex items-center gap-1 text-[0.6rem] font-bold shadow-lg border border-white/10">
              <Star className="w-2.5 h-2.5 fill-orange-400 text-orange-400" />
              {meal.rating && meal.rating > 0 ? meal.rating.toFixed(1) : 'New'}
            </div>
            
            <div className="bg-white/95 backdrop-blur-md text-gray-900 px-2 py-0.5 sm:py-1 rounded-lg flex items-center gap-1 text-[0.6rem] font-black shadow-lg border border-orange-50">
              <Clock className="w-2.5 h-2.5 text-orange-600" />
              30m
            </div>
          </div>
            {/* Sold-out overlay */}
            {meal.stock === 0 && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
                <span className="text-xs font-black text-red-600 uppercase tracking-widest bg-white px-3 py-1.5 rounded-xl shadow-md border border-red-100">🚫 Sold Out Today</span>
              </div>
            )}
          </div>

        {/* Info Content - Tightened Padding */}
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col gap-0.5 mb-3">
            <div className="flex items-center gap-1 text-[0.55rem] font-black uppercase tracking-widest text-orange-600 mb-0.5">
              <span>Chef Special</span>
              <span className="w-1 h-1 bg-orange-600 rounded-full"></span>
              <span className="hidden xs:inline">Home Made</span>
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-gray-900 line-clamp-1 group-hover:text-orange-600 transition-colors leading-tight tracking-tight">
              {meal.name}
            </h3>
            {meal.vendors && (
              <p className="text-[0.6rem] text-gray-400 font-medium italic truncate">
                by <span className="text-gray-600 font-bold">{meal.vendors.business_name}</span>
              </p>
            )}
          </div>

          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
            <div className="flex flex-col">
              <span className="text-[0.55rem] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Per Meal</span>
              <span className="text-lg sm:text-xl font-black text-gray-900 tracking-tighter">
                {formatCurrency(meal.price)}
              </span>
            </div>
            
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={meal.stock === 0}
              aria-label={`Add ${meal.name} to cart`}
              data-testid="quick-add-btn"
              className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md group/btn cursor-pointer ${
                isAdded
                  ? 'bg-emerald-600 text-white scale-105'
                  : 'bg-[#1A1A1A] text-white hover:bg-orange-600 hover:scale-110 active:scale-95'
              } disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-[#1A1A1A]`}
            >
              {isAdded ? (
                <Check className="w-4 h-4 text-white stroke-[3] animate-in zoom-in-50 duration-200" />
              ) : (
                <span className="text-base font-black group-hover/btn:rotate-90 transition-transform leading-none">+</span>
              )}
            </button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default memo(MealCard);
