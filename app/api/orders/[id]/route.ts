import { NextRequest, NextResponse } from 'next/server';
import { HANDOVER_EMBED } from '@/lib/utils/delivery-otp';
import { createClient, createServiceClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select(`*, ${HANDOVER_EMBED}`)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.customer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify order belongs to this customer
    const { data: order } = await supabase
      .from('orders')
      .select('customer_id, status')
      .eq('id', id)
      .single();

    if (!order || order.customer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // If updating rating (for reviews)
    if (body.rating) {
      if (order.status !== 'delivered') {
        return NextResponse.json({ error: 'Can only review delivered orders' }, { status: 400 });
      }

      const food = Number(body.rating?.food);
      const delivery = Number(body.rating?.delivery);
      const validScore = (n: number) => Number.isInteger(n) && n >= 1 && n <= 5;
      if (!validScore(food) || !validScore(delivery)) {
        return NextResponse.json({ error: 'Ratings must be whole numbers from 1 to 5' }, { status: 400 });
      }
      const rating = {
        food,
        delivery,
        ...(typeof body.rating.comment === 'string' ? { comment: body.rating.comment.slice(0, 1000) } : {}),
      };

      // Customers no longer have direct UPDATE on orders (migration 006);
      // ownership and status were checked above, so write with the service role.
      const { error } = await createServiceClient()
        .from('orders')
        .update({ rating, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('customer_id', user.id)
        .eq('status', 'delivered');

      if (error) {
        return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 });
      }

      // Kitchen ratings come from the reviews table (migration 006), so record
      // the food score there too (one review per order, on its first meal).
      const { data: fullOrder } = await createServiceClient()
        .from('orders')
        .select('items')
        .eq('id', id)
        .maybeSingle();
      const firstMealId = (fullOrder?.items as any[] | null)?.[0]?.meal_id;
      if (firstMealId) {
        const { error: reviewError } = await createServiceClient()
          .from('reviews')
          .upsert(
            {
              order_id: id,
              meal_id: firstMealId,
              user_id: user.id,
              rating: food,
              comment: (rating as { comment?: string }).comment ?? null,
              images: [],
            },
            { onConflict: 'meal_id,user_id,order_id' }
          );
        if (reviewError) console.error('Review upsert from order rating failed:', reviewError);
      }

      return NextResponse.json({ success: true });
    }

    // Payment status is set only by /api/payments/verify and the payment webhook.
    if (body.payment_status !== undefined) {
      return NextResponse.json({ error: 'Payment status cannot be changed here' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
