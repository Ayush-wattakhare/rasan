interface PopularMeal {
  name: string;
  orders: number;
  revenue: number;
}

interface PopularMealsProps {
  meals: PopularMeal[];
}

export function PopularMeals({ meals }: PopularMealsProps) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[0.6rem] font-black uppercase tracking-widest text-orange-600">
            Culinary Hits
          </span>
          <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tight">
            Top Performing Dishes
          </h3>
        </div>
      </div>
      <div className="space-y-3 pt-2">
        {meals.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
            No meal performance data yet
          </div>
        ) : (
          meals.map((meal, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3.5 bg-gray-50/80 hover:bg-orange-50/50 rounded-2xl border border-gray-100 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs">
                  #{index + 1}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{meal.name}</h4>
                  <p className="text-xs text-gray-500 font-medium">
                    {meal.orders} {meal.orders === 1 ? 'order' : 'orders'} sold
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-white font-black text-xs text-orange-600 rounded-xl border border-gray-200/80 shadow-xs">
                  ₹{meal.revenue.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

