import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      .select('*')
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

      const { error } = await supabase
        .from('orders')
        .update({ rating, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 });
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
