import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { Star, Clock, Bike } from 'lucide-react';

export default async function PopularVendors() {
  let vendors: any[] | null = null;
  try {
    const supabase = await createClient();

    const { data } = await supabase
      .from('vendors')
      .select('*')
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .limit(8);
    vendors = data;
  } catch {
    // If DB is unreachable, fail gracefully
  }

  if (!vendors || vendors.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 md:mb-10">
          <h2 className="mb-2 text-2xl md:text-3xl font-bold text-text-primary">
            Top Restaurants
          </h2>
          <p className="text-sm md:text-base text-text-secondary">
            Best food places with great reviews
          </p>
        </div>

        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {vendors.map((vendor) => (
            <Link key={vendor.id} href={`/vendors/${vendor.id}`} className="group">
              <Card className="h-full border-0 shadow-card hover:shadow-hover smooth-transition bg-white overflow-hidden">
                {/* Restaurant Banner */}
                <div className="relative h-36 bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                  <span className="text-5xl group-hover:scale-110 smooth-transition">🏪</span>
                  
                  {/* Offer Badge */}
                  <div className="absolute top-2 left-2 bg-primary text-white px-2 py-1 rounded text-xs font-bold">
                    20% OFF
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="mb-2">
                    <h3 className="text-base md:text-lg font-bold text-text-primary line-clamp-1 group-hover:text-primary smooth-transition">
                      {vendor.business_name}
                    </h3>
                  </div>

                  {/* Cuisine Tags */}
                  <div className="mb-3 text-xs text-text-secondary line-clamp-1">
                    {vendor.cuisine?.slice(0, 3).join(', ')}
                  </div>

                  {/* Rating and Info */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <div className="flex items-center gap-1 bg-green-600 text-white px-1.5 py-0.5 rounded">
                        <Star className="w-3 h-3 fill-white" />
                        <span className="font-bold">{vendor.rating?.toFixed(1) || '4.0'}</span>
                      </div>
                      <span className="text-text-light">({vendor.total_orders || 100}+)</span>
                    </div>
                    <div className="flex items-center gap-1 text-text-secondary">
                      <Clock className="w-3 h-3" />
                      <span>30 mins</span>
                    </div>
                  </div>

                  {/* Delivery Info */}
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1 text-xs text-text-light">
                    <Bike className="w-3 h-3" />
                    <span>Free delivery above ₹199</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button size="lg" variant="outline" className="border-2 hover:bg-primary hover:text-white hover:border-primary" asChild>
            <Link href="/vendors">View All Restaurants</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
