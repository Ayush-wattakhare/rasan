import { notFound } from 'next/navigation';
import { createClient, createStaticClient } from '@/lib/supabase/server';
import { getMealById } from '@/lib/services/meal-service';
import MealDetails from '@/components/meals/meal-details';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Enable ISR with 60 second revalidation
export const revalidate = 60;

// Generate static params for popular meals
export async function generateStaticParams() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url.includes('placeholder')) {
    return [];
  }

  try {
    const supabase = createStaticClient();
    
    const { data: meals } = await supabase
      .from('meals')
      .select('id')
      .eq('is_available', true)
      .order('rating', { ascending: false })
      .limit(20);

    return meals?.map((meal) => ({ id: meal.id })) || [];
  } catch {
    return [];
  }
}

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

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <Link href="/meals">
          <Button variant="ghost">← Back to Meals</Button>
        </Link>
      </div>

      <MealDetails meal={meal as any} />
    </div>
  );
}
