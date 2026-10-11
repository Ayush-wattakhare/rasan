import { createClient, createServiceClient } from '@/lib/supabase/server';
import { createHandoverCode } from '@/lib/utils/delivery-otp-server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch group order
    const { data: groupOrder } = await supabase
      .from('group_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (!groupOrder) {
      return NextResponse.json(
        { error: 'Group order not found' },
        { status: 404 }
      );
    }

    // Verify user is host
    if (groupOrder.host_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the host can finalize the order' },
        { status: 403 }
      );
    }

    if (groupOrder.status !== 'open') {
      return NextResponse.json(
        { error: 'Group order is not open' },
        { status: 400 }
      );
    }

    const participants = groupOrder.participants || [];
    if (participants.length === 0) {
      return NextResponse.json(
        { error: 'No participants in group order' },
        { status: 400 }
      );
    }

    // Aggregate all items from participants (quantities validated; prices from the database)
    const MAX_QUANTITY = 50;
    const allItems: any[] = [];
    const itemMap = new Map<string, number>();

    for (const participant of participants as any[]) {
      for (const item of participant?.items ?? []) {
        const quantity = Number(item?.quantity);
        if (typeof item?.meal_id !== 'string' || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
          return NextResponse.json({ error: 'Invalid item in group order' }, { status: 400 });
        }
        itemMap.set(item.meal_id, (itemMap.get(item.meal_id) ?? 0) + quantity);
      }
    }

    if (itemMap.size === 0) {
      return NextResponse.json({ error: 'No items in group order' }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const { data: meals } = await serviceClient
      .from('meals')
      .select('id, name, price, vendor_id, is_available')
      .in('id', Array.from(itemMap.keys()));

    for (const [mealId, quantity] of itemMap.entries()) {
      const meal = meals?.find((m) => m.id === mealId);
      if (!meal || meal.vendor_id !== groupOrder.vendor_id || !meal.is_available) {
        return NextResponse.json(
          { error: `Item ${meal?.name ?? mealId} is not available from this kitchen` },
          { status: 409 }
        );
      }
      allItems.push({
        meal_id: mealId,
        name: meal.name,
        quantity,
        price: Number(meal.price),
        customizations: [],
      });
    }

    // Calculate totals
    const subtotal = allItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const deliveryFee = 50; // Fixed for group orders
    const tax = subtotal * 0.05;
    const total = subtotal + deliveryFee + tax;

    // Get host's address (use first participant's address or default)
    const { data: hostProfile } = await supabase
      .from('profiles')
      .select('address')
      .eq('id', user.id)
      .single();

    // Claim the group order first so it can only be finalized once.
    const { data: claimed } = await supabase
      .from('group_orders')
      .update({ status: 'ordered' })
      .eq('id', id)
      .eq('status', 'open')
      .select('id')
      .maybeSingle();

    if (!claimed) {
      return NextResponse.json({ error: 'Group order is not open' }, { status: 400 });
    }

    // Create order (server-side insert; customers cannot insert orders directly)
    const { data: order, error: orderError } = await serviceClient
      .from('orders')
      .insert({
        customer_id: user.id,
        vendor_id: groupOrder.vendor_id,
        items: allItems,
        subtotal,
        delivery_fee: deliveryFee,
        tax,
        discount: 0,
        total,
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'cash',
        delivery_address: (hostProfile?.address as any) || {
          street: '',
          city: '',
          state: '',
          zip_code: '',
          coordinates: { lat: 0, lng: 0 },
        },
      } as any)
      .select()
      .single();

    if (orderError || !order || !(await createHandoverCode(order.id))) {
      console.error('Error creating order:', orderError);
      if (order) await serviceClient.from('orders').delete().eq('id', order.id);
      await supabase.from('group_orders').update({ status: 'open' }).eq('id', id);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Send notifications to all participants
    for (const participant of participants) {
      await serviceClient.from('notifications').insert({
        user_id: participant.user_id,
        type: 'order',
        title: 'Group Order Placed',
        message: `Your group order has been placed! Order #${order.order_number}`,
        data: { order_id: order.id, group_order_id: id },
      });
    }

    return NextResponse.json({ order_id: order.id, order_number: order.order_number });
  } catch (error) {
    console.error('Error in POST /api/group-orders/[id]/finalize:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
