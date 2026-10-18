import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils/format';
import { formatDistance, getMealOrderCounts, type ServiceArea } from '@/lib/location/nearby';
import { Star, Clock, MapPin } from 'lucide-react';

interface FeaturedMealsProps {
  area: ServiceArea;
}

/**
 * Dishes from kitchens that deliver to the customer's location only.
 * Ranked by real delivered orders (last 30 days); with no orders yet the
 * heading says so instead of claiming "most ordered".
 */
export default async function FeaturedMeals({ area }: FeaturedMealsProps) {
  // Out of range / no location: the hero shows the message, never other cities' food.
  if (area.status !== 'available') return null;

  const distanceByVendor = new Map(area.kitchens.map((k) => [k.id, k.distance_km]));
  let meals: any[] = [];
  let hasOrders = false;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('meals')
      .select('id, name, price, image_url, is_veg, rating, preparation_time, vendor_id, created_at, vendors!inner(business_name, is_active)')
      .in('vendor_id', Array.from(distanceByVendor.keys()))
      .eq('is_available', true)
      .eq('vendors.is_active', true)
      .order('created_at', { ascending: false })
      .limit(60);

    const candidates = data || [];
    const counts = await getMealOrderCounts(supabase, candidates.map((m: any) => m.id));
    hasOrders = candidates.some((m: any) => (counts.get(m.id) || 0) > 0);

    meals = candidates
      .map((m: any) => ({ ...m, order_count: counts.get(m.id) || 0, distance_km: distanceByVendor.get(m.vendor_id) }))
      .sort((a, b) => b.order_count - a.order_count || a.distance_km - b.distance_km)
      .slice(0, 6);
  } catch {
    // If DB is unreachable, fail gracefully
  }

  if (meals.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-background-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 md:mb-10">
          <h2 className="mb-2 text-2xl md:text-3xl font-bold text-text-primary">
            {hasOrders ? 'Popular Dishes Near You' : 'Dishes Near You'}
          </h2>
          <p className="text-sm md:text-base text-text-secondary">
            {hasOrders
              ? 'Most ordered in the last 30 days from kitchens that deliver to you'
              : 'Fresh from home kitchens that deliver to you'}
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
                    <div className="flex h-full w-full items-center justify-center text-4xl md:text-5xl" aria-hidden="true">
                      🍽️
                    </div>
                  )}

                  <div className="absolute top-3 left-3">
                    <div
                      role="img"
                      aria-label={meal.is_veg ? 'Vegetarian' : 'Non-vegetarian'}
                      className={`w-5 h-5 border-2 ${meal.is_veg ? 'border-green-600' : 'border-red-600'} bg-white flex items-center justify-center rounded-sm`}
                    >
                      <div className={`w-2 h-2 rounded-full ${meal.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                    </div>
                  </div>

                  {Number(meal.rating) > 0 && (
                    <div className="absolute bottom-3 left-3 bg-white px-2 py-1 rounded-lg shadow-md flex items-center gap-1">
                      <Star className="w-3 h-3 fill-green-600 text-green-600" aria-hidden="true" />
                      <span className="text-xs font-bold text-text-primary">{Number(meal.rating).toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  <h3 className="mb-1 font-bold text-base md:text-lg text-text-primary line-clamp-1 group-hover:text-primary smooth-transition">
                    {meal.name}
                  </h3>
                  <p className="mb-2 text-xs md:text-sm text-text-secondary line-clamp-1">
                    {meal.vendors?.business_name || 'Home kitchen'}
                    {Number.isFinite(meal.distance_km) && (
                      <span className="text-text-light"> · {formatDistance(meal.distance_km)}</span>
                    )}
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-text-primary">{formatCurrency(meal.price)}</span>
                    <div className="flex items-center gap-3 text-xs text-text-light">
                      {meal.order_count > 0 && <span>{meal.order_count} ordered</span>}
                      {Number(meal.preparation_time) > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" aria-hidden="true" />
                          {meal.preparation_time} min prep
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button size="lg" variant="outline" className="border-2 hover:bg-primary hover:text-white hover:border-primary" asChild>
            <Link href="/meals">
              <MapPin className="w-4 h-4 mr-1" aria-hidden="true" /> See All Dishes Near You
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
