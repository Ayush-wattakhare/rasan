import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils/format';
import { Star, Clock } from 'lucide-react';

export default async function FeaturedMeals() {
  let meals: any[] | null = null;
  try {
    const supabase = await createClient();

    const { data } = await supabase
      .from('meals')
      .select('*, vendors!inner(business_name, is_active)')
      .eq('is_available', true)
      .eq('vendors.is_active', true)
      .not('vendors.business_name', 'ilike', '%test%')
      .order('rating', { ascending: false })
      .limit(6);
    meals = data;
  } catch {
    // If DB is unreachable, fail gracefully
  }

  if (!meals || meals.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 bg-background-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 md:mb-10">
          <h2 className="mb-2 text-2xl md:text-3xl font-bold text-text-primary">
            Popular Dishes Near You
          </h2>
          <p className="text-sm md:text-base text-text-secondary">
            Most ordered dishes from top-rated restaurants
          </p>
        </div>

        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {meals.map((meal) => (
            <Link key={meal.id} href={`/meals/${meal.id}`} className="group">
              <Card className="overflow-hidden bg-white border-0 shadow-card hover:shadow-hover smooth-transition h-full">
                <div className="relative h-44 sm:h-48 w-full bg-gray-100">
                  {meal.image_url ? (
                    <Image
                      src={meal.image_url}
                      alt={meal.name}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 smooth-transition"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl md:text-5xl">
                      🍽️
                    </div>
                  )}
                  
                  {/* Veg/Non-veg Badge */}
                  <div className="absolute top-3 left-3">
                    <div className={`w-5 h-5 border-2 ${meal.is_veg ? 'border-green-600' : 'border-red-600'} bg-white flex items-center justify-center rounded-sm`}>
                      <div className={`w-2 h-2 rounded-full ${meal.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                    </div>
                  </div>

                  {/* Rating Badge */}
                  {meal.rating > 0 && (
                    <div className="absolute bottom-3 left-3 bg-white px-2 py-1 rounded-lg shadow-md flex items-center gap-1">
                      <Star className="w-3 h-3 fill-green-600 text-green-600" />
                      <span className="text-xs font-bold text-text-primary">{meal.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="mb-1">
                    <h3 className="font-bold text-base md:text-lg text-text-primary line-clamp-1 group-hover:text-primary smooth-transition">
                      {meal.name}
                    </h3>
                  </div>
                  
                  <p className="mb-2 text-xs md:text-sm text-text-secondary line-clamp-1">
                    {meal.vendors?.business_name || 'Unknown Vendor'}
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-text-primary">
                      {formatCurrency(meal.price)}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-text-light">
                      <Clock className="w-3 h-3" />
                      <span>25-30 mins</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button size="lg" variant="outline" className="border-2 hover:bg-primary hover:text-white hover:border-primary" asChild>
            <Link href="/meals">See All Restaurants</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
