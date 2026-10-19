import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistance, type ServiceArea } from '@/lib/location/nearby';
import { Star, MapPin } from 'lucide-react';

interface PopularVendorsProps {
  area: ServiceArea;
}

/** Kitchens that deliver to the customer's location, nearest first. */
export default function PopularVendors({ area }: PopularVendorsProps) {
  // Out of range / no location: the hero shows the message, never other cities' kitchens.
  if (area.status !== 'available') return null;

  const kitchens = area.kitchens.slice(0, 8);

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 md:mb-10">
          <h2 className="mb-2 text-2xl md:text-3xl font-bold text-text-primary">Kitchens Near You</h2>
          <p className="text-sm md:text-base text-text-secondary">
            {area.kitchens.length} home kitchen{area.kitchens.length === 1 ? '' : 's'} deliver to
            {area.location.city ? ` ${area.location.city}` : ' your location'}
          </p>
        </div>

        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {kitchens.map((kitchen) => {
            const rating = Number(kitchen.rating) || 0;
            const orders = Number(kitchen.total_orders) || 0;
            return (
              <Link key={kitchen.id} href={`/vendors/${kitchen.id}`} className="group">
                <Card className="h-full border-0 shadow-card hover:shadow-hover smooth-transition bg-white overflow-hidden">
                  <div className="relative h-36 bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                    <span className="text-5xl group-hover:scale-110 smooth-transition" aria-hidden="true">🏪</span>
                    <div className="absolute top-2 left-2 bg-white/95 text-gray-900 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 shadow-sm">
                      <MapPin className="w-3 h-3 text-primary" aria-hidden="true" />
                      {formatDistance(kitchen.distance_km)}
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h3 className="mb-2 text-base md:text-lg font-bold text-text-primary line-clamp-1 group-hover:text-primary smooth-transition">
                      {kitchen.business_name}
                    </h3>

                    {kitchen.cuisine && kitchen.cuisine.length > 0 && (
                      <div className="mb-3 text-xs text-text-secondary line-clamp-1">
                        {kitchen.cuisine.slice(0, 3).join(', ')}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 bg-green-600 text-white px-1.5 py-0.5 rounded">
                        <Star className="w-3 h-3 fill-white" aria-hidden="true" />
                        <span className="font-bold">{rating > 0 ? rating.toFixed(1) : 'New'}</span>
                      </div>
                      {orders > 0 && (
                        <span className="text-text-light">
                          {orders} order{orders === 1 ? '' : 's'} delivered
                        </span>
                      )}
                    </div>

                    {kitchen.address && (
                      <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-text-light line-clamp-1">
                        {kitchen.address}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Button size="lg" variant="outline" className="border-2 hover:bg-primary hover:text-white hover:border-primary" asChild>
            <Link href="/vendors">View All Kitchens Near You</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
