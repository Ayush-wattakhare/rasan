'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Star,
  Clock,
  MapPin,
  Heart,
  ShoppingBag
} from 'lucide-react';
import SubscriptionModal from '@/components/meals/subscription-modal';
import { AddToCartButton } from '@/components/meals/add-to-cart-button';

interface Meal {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_veg: boolean;
  rating: number;
  preparation_time: number;
  vendor_id: string;
  vendors?: {
    id: string;
    business_name: string;
    rating: number;
  } | null;
}

interface TopMealsSectionProps {
  meals: Meal[];
}

export default function TopMealsSection({ meals }: TopMealsSectionProps) {
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubscribeClick = (meal: Meal, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedMeal(meal);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {meals.map((meal) => (
          <div key={meal.id} className="relative">
            <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group h-full">
              {/* Meal Image */}
              <Link href={`/meals/${meal.id}`}>
                <div className="relative h-48 bg-gradient-to-br from-orange-100 to-orange-50 overflow-hidden">
                  {meal.image_url ? (
                    <img
                      src={meal.image_url}
                      alt={meal.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      🍛
                    </div>
                  )}
                  
                  {/* Veg/Non-veg Badge */}
                  <div className="absolute top-3 left-3">
                    <div className={`w-6 h-6 border-2 flex items-center justify-center ${
                      meal.is_veg ? 'border-green-600' : 'border-red-600'
                    }`}>
                      <div className={`w-3 h-3 rounded-full ${
                        meal.is_veg ? 'bg-green-600' : 'bg-red-600'
                      }`}></div>
                    </div>
                  </div>

                  {/* Rating Badge */}
                  <div className="absolute top-3 right-3 bg-green-600 text-white px-2 py-1 rounded-md flex items-center gap-1 text-sm font-semibold shadow-lg">
                    <Star className="w-3 h-3 fill-white" />
                    {meal.rating?.toFixed(1) || '4.5'}
                  </div>

                  {/* Favorite Button */}
                  <button className="absolute bottom-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                    <Heart className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </Link>

              <CardContent className="p-4">
                <Link href={`/meals/${meal.id}`}>
                  {/* Meal Name */}
                  <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                    {meal.name}
                  </h3>

                  {/* Vendor Info */}
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                    <MapPin className="w-3 h-3" />
                    <span className="line-clamp-1">
                      {meal.vendors?.business_name || 'Home Chef'}
                    </span>
                  </div>

                  {/* Preparation Time */}
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                    <Clock className="w-3 h-3" />
                    <span>{meal.preparation_time} mins</span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {meal.description || 'Homemade fresh food prepared with love and care'}
                  </p>
                </Link>

                {/* Subscription Options */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={(e) => handleSubscribeClick(meal, e)}
                    className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-medium hover:bg-orange-200 transition-colors"
                  >
                    Daily
                  </button>
                  <button
                    onClick={(e) => handleSubscribeClick(meal, e)}
                    className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-medium hover:bg-orange-200 transition-colors"
                  >
                    Weekly
                  </button>
                </div>

                {/* Price and Add Button */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold text-gray-900">
                      ₹{meal.price}
                      <span className="text-sm text-gray-500 font-normal">/meal</span>
                    </div>
                  </div>
                  <AddToCartButton 
                    meal={{
                      id: meal.id,
                      vendor_id: meal.vendor_id || meal.vendors?.id || '',
                      name: meal.name,
                      price: meal.price,
                      image_url: meal.image_url,
                      is_veg: meal.is_veg,
                      is_available: true
                    }}
                    size="sm"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Subscription Modal */}
      {selectedMeal && (
        <SubscriptionModal
          meal={selectedMeal}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedMeal(null);
          }}
        />
      )}
    </>
  );
}
