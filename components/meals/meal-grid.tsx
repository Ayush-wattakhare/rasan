'use client';

import MealCard from './meal-card';

interface MealGridProps {
  meals: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string | null;
    is_vegetarian: boolean;
    rating: number | null;
    stock: number | null;
    vendors?: {
      business_name: string;
    };
  }>;
}

export default function MealGrid({ meals }: MealGridProps) {
  if (meals.length === 0) {
    return (
      <div className="py-16 text-center bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border-2 border-dashed border-orange-200">
        <div className="mb-4 text-7xl">🏠</div>
        <h3 className="mb-2 text-xl font-bold text-text-primary">No meals found right now</h3>
        <p className="text-sm text-text-secondary mb-6">
          Our home chefs are preparing fresh meals. Try adjusting your filters!
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <span className="px-4 py-2 bg-white border-2 border-orange-200 text-orange-600 rounded-full text-sm font-medium hover:bg-orange-50 cursor-pointer">
            🍛 Dal Chawal
          </span>
          <span className="px-4 py-2 bg-white border-2 border-orange-200 text-orange-600 rounded-full text-sm font-medium hover:bg-orange-50 cursor-pointer">
            🫓 Roti Sabzi
          </span>
          <span className="px-4 py-2 bg-white border-2 border-orange-200 text-orange-600 rounded-full text-sm font-medium hover:bg-orange-50 cursor-pointer">
            🍲 Thali
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:gap-4 md:gap-5 grid-cols-2 lg:grid-cols-3">
      {meals.map((meal) => (
        <MealCard key={meal.id} meal={meal} />
      ))}
    </div>
  );
}
