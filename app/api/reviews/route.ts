import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, vendorId, rating, foodRating, comment } = body;

    if (!orderId || !vendorId || !rating) {
      return NextResponse.json(
        { error: 'OrderId, vendorId, and rating score are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
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

    const firstMealId = (order.items as any)?.[0]?.meal_id || '00000000-0000-0000-0000-000000000000';

    // Insert or update review record matching DB schema
    const { data: review, error: reviewError } = await serviceClient
      .from('reviews')
      .upsert({
        order_id: orderId,
        meal_id: firstMealId,
        user_id: user.id,
        rating: Number(rating),
        comment: comment || null,
        images: [],
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Review insert error:', reviewError);
      return NextResponse.json(
        { error: `Failed to save review: ${reviewError.message}` },
        { status: 500 }
      );
    }

    // Recalculate average rating for vendor
    const { data: vendorReviews } = await serviceClient
      .from('reviews')
      .select('rating')
      .eq('meal_id', firstMealId);

    if (vendorReviews && vendorReviews.length > 0) {
      const totalScore = vendorReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
      const avgRating = Number((totalScore / vendorReviews.length).toFixed(1));

      // Update vendors table rating
      await serviceClient
        .from('vendors')
        .update({
          rating: avgRating,
        })
        .eq('id', vendorId);
    }

    return NextResponse.json({
      success: true,
      message: 'Review and rating submitted successfully! Vendor rating updated.',
      review,
    });
  } catch (error: any) {
    console.error('Unexpected error in review API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
