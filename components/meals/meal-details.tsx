'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/format';
import NutritionalInfo from './nutritional-info';
import { AddToCartButton } from './add-to-cart-button';

interface MealDetailsProps {
  meal: {
    id: string;
    vendor_id: string;
    name: string;
    description: string;
    price: number;
    image_url: string | null;
    is_vegetarian: boolean;
    is_available: boolean;
    stock: number | null;
    meal_type: string;
    ingredients: string[] | null;
    allergens: string[] | null;
    nutritional_info: any;
    rating: number | null;
    total_reviews: number | null;
    vendors: {
      id: string;
      business_name: string;
      rating: number | null;
    };
  };
}

export default function MealDetails({ meal }: MealDetailsProps) {
  return (
    <div className="space-y-12">
      <div className="grid gap-12 lg:grid-cols-2">
        {/* Premium Image Showcase */}
        <div className="relative aspect-square overflow-hidden rounded-[3rem] shadow-2xl group">
          {meal.image_url ? (
            <Image
              src={meal.image_url}
              alt={meal.name}
              fill
              unoptimized
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 text-9xl grayscale group-hover:grayscale-0 transition-all duration-700">
              🍱
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-10 left-10">
             <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-white font-black uppercase tracking-widest text-sm italic">Chef Just Started Preparation</span>
             </div>
          </div>
        </div>

        <div className="space-y-10 py-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-orange-600/10 text-orange-600 text-[0.65rem] font-black uppercase tracking-[0.2em] italic">
                {meal.meal_type}
              </span>
              {meal.is_vegetarian && (
                <span className="px-3 py-1 rounded-full bg-green-600/10 text-green-600 text-[0.65rem] font-black uppercase tracking-[0.2em] italic">
                  🌱 100% Veg
                </span>
              )}
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-[#1A1A1A] tracking-tighter italic leading-tight uppercase">
              {meal.name}
            </h1>
            <div className="flex items-center gap-2 pt-2">
              <span className="text-gray-400 font-medium">Curated by</span>
              <Link
                href={`/vendors/${meal.vendors.id}`}
                className="text-orange-600 font-extrabold hover:text-orange-500 transition-colors border-b-2 border-orange-600/20"
              >
                {meal.vendors.business_name}
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex flex-col">
               <span className="text-[0.6rem] font-black uppercase tracking-widest text-gray-400 mb-1">Chef Rating</span>
               <div className="flex items-center gap-2">
                 <span className="text-3xl font-black text-[#1A1A1A] tracking-tighter">{(meal.rating || 4.8).toFixed(1)}</span>
                 <div className="flex gap-0.5">
                   {[1,2,3,4,5].map(i => (
                     <span key={i} className="text-orange-500 text-sm">★</span>
                   ))}
                 </div>
               </div>
            </div>
            
            <div className="w-px h-12 bg-gray-100"></div>

            <div className="flex flex-col">
               <span className="text-[0.6rem] font-black uppercase tracking-widest text-gray-400 mb-1">Preparation Time</span>
               <span className="text-2xl font-extrabold text-[#1A1A1A] tracking-tight">35-45 <span className="text-gray-300">MINS</span></span>
            </div>
          </div>

          <div className="p-8 rounded-[2rem] bg-white border border-gray-100 shadow-xl space-y-4">
             <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-[#1A1A1A] tracking-tighter">{formatCurrency(meal.price)}</span>
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest italic line-through">₹{(meal.price * 1.2).toFixed(0)}</span>
             </div>
             <p className="text-gray-500 leading-relaxed font-medium">
               {meal.description || "A delicately balanced home-cooked meal prepared with secret family spices and farm-fresh ingredients."}
             </p>
             <div className="pt-6">
               <AddToCartButton
                  meal={{
                    id: meal.id,
                    vendor_id: meal.vendor_id,
                    name: meal.name,
                    price: meal.price,
                    image_url: meal.image_url,
                    is_veg: meal.is_vegetarian,
                    is_available: meal.is_available,
                    stock: meal.stock,
                  }}
                  size="lg"
                  showQuantity={true}
                />
             </div>
          </div>
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-3">
         {meal.ingredients && meal.ingredients.length > 0 && (
           <Card className="border-none shadow-xl bg-white rounded-[2rem] p-4">
             <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-xl">🥕</div>
                  <h3 className="text-lg font-black text-[#1A1A1A] tracking-tight italic uppercase">Pure Ingredients</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {meal.ingredients.map((ingredient, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-50 rounded-lg text-xs font-bold text-gray-400 uppercase tracking-wider border border-gray-100">
                      {ingredient}
                    </span>
                  ))}
                </div>
             </CardContent>
           </Card>
         )}

         {meal.allergens && meal.allergens.length > 0 && (
           <Card className="border-none shadow-xl bg-red-50 rounded-[2rem] p-4">
             <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3 mb-2 text-red-600">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-xl">⚠️</div>
                  <h3 className="text-lg font-black tracking-tight italic uppercase">Allergen Alert</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {meal.allergens.map((allergen, index) => (
                    <span key={index} className="px-3 py-1 bg-white rounded-lg text-xs font-black text-red-600 uppercase tracking-widest border border-red-200">
                      {allergen}
                    </span>
                  ))}
                </div>
             </CardContent>
           </Card>
         )}

         <div className="lg:col-span-1">
            <NutritionalInfo nutritionalInfo={meal.nutritional_info} />
         </div>
      </div>
    </div>
  );
}
