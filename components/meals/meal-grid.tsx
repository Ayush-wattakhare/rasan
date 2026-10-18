'use client';

import MealCard from './meal-card';

interface MealGridProps {
  meals: Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    image_url: string | null;
    is_veg: boolean | null;
    rating: number | null;
    stock: number | null;
    preparation_time?: number | null;
    vendor_id?: string;
    vendors?: {
      id?: string;
      business_name: string;
    };
  }>;
  /** False for preview listings of kitchens that don't deliver to the customer. */
  orderable?: boolean;
}

export default function MealGrid({ meals, orderable = true }: MealGridProps) {
  if (meals.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4 text-6xl" aria-hidden="true">🍽️</div>
        <h3 className="mb-2 text-xl font-semibold">No meals found</h3>
        <p className="text-muted-foreground">
          Try adjusting your filters or search criteria
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:gap-6 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {meals.map((meal) => (
        <MealCard key={meal.id} meal={meal} orderable={orderable} />
      ))}
    </div>
  );
}
