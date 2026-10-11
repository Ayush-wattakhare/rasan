import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * Public reviews for a meal. Reviewer profiles are private (migration 003), so
 * only the reviewer's name and avatar are returned, read with the service role.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: reviews, error } = await createServiceClient()
    .from('reviews')
    .select(`
      id, meal_id, order_id, rating, comment, images, created_at, updated_at,
      user:profiles(name, avatar_url)
    `)
    .eq('meal_id', id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Reviews fetch error:', error);
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 });
  }

  const list = reviews || [];
  const averageRating = list.length > 0
    ? list.reduce((sum, review) => sum + review.rating, 0) / list.length
    : 0;

  return NextResponse.json({
    reviews: list,
    averageRating,
    totalReviews: list.length,
  });
}
