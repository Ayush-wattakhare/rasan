import { NextRequest, NextResponse } from 'next/server';
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

      const { error } = await supabase
        .from('orders')
        .update({ rating: body.rating, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // If updating payment status (e.g. online/test payment completion)
    if (body.payment_status) {
      const serviceClient = createServiceClient();
      const updates: any = {
        payment_status: body.payment_status,
        updated_at: new Date().toISOString(),
      };
      if (body.payment_id) updates.payment_id = body.payment_id;
      if (body.payment_status === 'paid') updates.status = 'confirmed';

      const { data: updatedOrder, error: updateError } = await serviceClient
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, order: updatedOrder });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
