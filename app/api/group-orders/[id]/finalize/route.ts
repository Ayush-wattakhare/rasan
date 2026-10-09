import { createClient } from '@/lib/supabase/server';
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

    // Aggregate all items from participants
    const allItems: any[] = [];
    const itemMap = new Map();

    participants.forEach((participant: any) => {
      participant.items.forEach((item: any) => {
        const key = item.meal_id;
        if (itemMap.has(key)) {
          const existing = itemMap.get(key);
          existing.quantity += item.quantity;
        } else {
          itemMap.set(key, { ...item });
        }
      });
    });

    // Convert map to array and fetch meal details
    for (const [mealId, item] of itemMap.entries()) {
      const { data: meal } = await supabase
        .from('meals')
        .select('name, price')
        .eq('id', mealId)
        .single();

      if (meal) {
        allItems.push({
          meal_id: mealId,
          name: meal.name,
          quantity: item.quantity,
          price: meal.price,
          customizations: [],
        });
      }
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

    // Create order
    const { data: order, error: orderError } = await supabase
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
        delivery_address: hostProfile?.address || {
          street: '',
          city: '',
          state: '',
          zip_code: '',
          coordinates: { lat: 0, lng: 0 },
        },
      } as any)
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Update group order status
    await supabase
      .from('group_orders')
      .update({ status: 'ordered' })
      .eq('id', id);

    // Send notifications to all participants
    for (const participant of participants) {
      await supabase.from('notifications').insert({
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
