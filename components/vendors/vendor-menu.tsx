import MealCard from '@/components/meals/meal-card';

interface VendorMenuProps {
  meals: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string | null;
    is_vegetarian: boolean;
    rating: number | null;
    stock: number | null;
  }>;
}

export default function VendorMenu({ meals }: VendorMenuProps) {
  if (meals.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4 text-6xl">🍽️</div>
        <h3 className="mb-2 text-xl font-semibold">No meals available</h3>
        <p className="text-muted-foreground">
          This vendor hasn&apos;t added any meals yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between border-b border-gray-100 pb-6">
        <div className="space-y-1">
          <p className="text-[0.65rem] font-black text-orange-600 uppercase tracking-[0.2em] italic">Freshly Prepared</p>
          <h2 className="text-3xl md:text-4xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
            Culinary <span className="text-gray-300">Creations</span>
          </h2>
        </div>
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest pb-1">
          {meals.length} Items Available
        </div>
      </div>

      <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {meals.map((meal) => (
          <div key={meal.id} className="scale-95 hover:scale-100 transition-transform duration-500">
            <MealCard meal={meal} />
          </div>
        ))}
      </div>
    </div>
  );
}
