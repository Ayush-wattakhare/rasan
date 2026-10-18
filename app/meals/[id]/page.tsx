import { notFound } from 'next/navigation';
import { createStaticClient } from '@/lib/supabase/server';
import { getMealById } from '@/lib/services/meal-service';
import MealDetails from '@/components/meals/meal-details';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getDeliveryLocation } from '@/lib/location/server-location';
import { deliveryRange } from '@/lib/location/delivery-range';
import { DeliveryRangeNotice } from '@/components/location/delivery-range-notice';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Rendered per request: the delivery banner depends on the customer's location
// cookie (reading cookies() already makes the page dynamic).

export default async function PublicMealDetailPage({ params }: PageProps) {
  const { id } = await params;
  let meal = null;

  try {
    const supabase = createStaticClient();
    meal = await getMealById(supabase, id);
  } catch {
    meal = null;
  }

  if (!meal || !meal.is_available) {
    notFound();
  }

  // Direct links still open the page, but a far-away kitchen can't be ordered from.
  const customer = await getDeliveryLocation();
  const range = deliveryRange(customer, (meal as any).vendors?.location);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <Link href="/meals">
          <Button variant="ghost">← Back to Meals</Button>
        </Link>
      </div>

      <DeliveryRangeNotice range={range} city={customer?.city} />

      <MealDetails
        meal={meal as any}
        orderDisabledReason={range.status === 'out-of-range' ? "Doesn't deliver to you" : null}
      />
    </div>
  );
}
