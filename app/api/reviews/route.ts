import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/guards';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;
    const user = auth.user;

    const body = await request.json();
    const { orderId, comment } = body ?? {};
    const rating = Number(body?.rating);

    if (!orderId || !rating) {
      return NextResponse.json(
        { error: 'OrderId and rating score are required' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be a whole number between 1 and 5' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Verify order exists and belongs to user
    const { data: order, error: orderError } = await serviceClient
      .from('orders')
      .select('id, customer_id, status, vendor_id, items')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.customer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (order.status !== 'delivered') {
      return NextResponse.json({ error: 'You can review an order after it is delivered' }, { status: 400 });
    }

    // The rated kitchen is always the order's kitchen, never a client-supplied id.
    const vendorId = order.vendor_id;

    const firstMealId = (order.items as any)?.[0]?.meal_id;
    if (!firstMealId) {
      return NextResponse.json({ error: 'Order has no items to review' }, { status: 400 });
    }

    // Insert or update review record matching DB schema
    const { data: review, error: reviewError } = await serviceClient
      .from('reviews')
      .upsert({
        order_id: orderId,
        meal_id: firstMealId,
        user_id: user.id,
        rating,
        comment: typeof comment === 'string' ? comment.slice(0, 1000) : null,
        images: [],
      }, { onConflict: 'meal_id,user_id,order_id' })
      .select()
      .single();

    if (reviewError) {
      console.error('Review insert error:', reviewError);
      return NextResponse.json(
        { error: 'Failed to save review' },
        { status: 500 }
      );
    }

    // Recalculate the kitchen's average across reviews of all its meals
    if (vendorId) {
      const { data: vendorMeals } = await serviceClient
        .from('meals')
        .select('id')
        .eq('vendor_id', vendorId);
      const mealIds = (vendorMeals || []).map((m) => m.id);

      if (mealIds.length > 0) {
        const { data: vendorReviews } = await serviceClient
          .from('reviews')
          .select('rating')
          .in('meal_id', mealIds);

        if (vendorReviews && vendorReviews.length > 0) {
          const totalScore = vendorReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
          const avgRating = Number((totalScore / vendorReviews.length).toFixed(1));
          await serviceClient.from('vendors').update({ rating: avgRating }).eq('id', vendorId);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Review and rating submitted successfully! Vendor rating updated.',
      review,
    });
  } catch (error: any) {
    console.error('Unexpected error in review API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
