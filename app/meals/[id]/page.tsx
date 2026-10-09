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
  const supabase = createStaticClient();
  
  const { data: meals } = await supabase
    .from('meals')
    .select('id')
    .eq('is_available', true)
    .order('rating', { ascending: false })
    .limit(20);

  return meals?.map((meal) => ({ id: meal.id })) || [];
}

export default async function PublicMealDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createStaticClient();

  const meal = await getMealById(supabase, id);

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
