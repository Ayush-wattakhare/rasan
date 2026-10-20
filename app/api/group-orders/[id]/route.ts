import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/guards';
import { isUuid } from '@/lib/utils/validation-ids';

const MAX_ITEMS = 20;
const MAX_QUANTITY = 20;

/**
 * Group orders are shared by link: any signed-in user who has the link may
 * view and join. RLS only lets the host (or existing participants) touch the
 * row, which made joining impossible, so these routes use the service role
 * and enforce the rules here instead.
 */
async function loadGroupOrder(id: string) {
  return (createServiceClient().from('group_orders') as any)
    .select(
      `*,
      vendors:vendor_id (
        id,
        business_name,
        cuisine,
        rating
      )`
    )
    .eq('id', id)
    .maybeSingle();
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Group order not found' }, { status: 404 });

  const { data: groupOrder, error } = await loadGroupOrder(id);
  if (error || !groupOrder) {
    return NextResponse.json({ error: 'Group order not found' }, { status: 404 });
  }
  return NextResponse.json(groupOrder);
}

/** Adds or replaces the caller's items. Prices and the contribution come from the database. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  try {
    const { id } = await params;
    if (!isUuid(id)) return NextResponse.json({ error: 'Group order not found' }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const rawItems = Array.isArray(body?.items) ? body.items : [];
    if (rawItems.length === 0 || rawItems.length > MAX_ITEMS) {
      return NextResponse.json({ error: 'Choose between 1 and 20 items' }, { status: 400 });
    }

    const quantities = new Map<string, number>();
    for (const item of rawItems) {
      const quantity = Number(item?.quantity);
      if (!isUuid(item?.meal_id) || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
        return NextResponse.json({ error: 'Invalid item' }, { status: 400 });
      }
      quantities.set(item.meal_id, (quantities.get(item.meal_id) ?? 0) + quantity);
    }

    const db = createServiceClient();
    const { data: groupOrder } = await (db.from('group_orders') as any).select('*').eq('id', id).maybeSingle();
    if (!groupOrder) return NextResponse.json({ error: 'Group order not found' }, { status: 404 });
    if (new Date(groupOrder.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Group order has expired' }, { status: 400 });
    }
    if (groupOrder.status !== 'open') {
      return NextResponse.json({ error: 'Group order is not open' }, { status: 400 });
    }

    const { data: meals } = await db
      .from('meals')
      .select('id, name, price, vendor_id, is_available')
      .in('id', Array.from(quantities.keys()));

    const items: { meal_id: string; name: string; price: number; quantity: number }[] = [];
    for (const [mealId, quantity] of quantities) {
      const meal = meals?.find((m) => m.id === mealId);
      if (!meal || meal.vendor_id !== groupOrder.vendor_id || !meal.is_available) {
        return NextResponse.json({ error: `${meal?.name ?? 'An item'} is not available from this kitchen` }, { status: 409 });
      }
      items.push({ meal_id: mealId, name: meal.name, price: Number(meal.price), quantity });
    }
    const contribution = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const participants: any[] = Array.isArray(groupOrder.participants) ? [...groupOrder.participants] : [];
    const entry = { user_id: user.id, items, contribution };
    const index = participants.findIndex((p) => p?.user_id === user.id);
    if (index >= 0) participants[index] = entry;
    else participants.push(entry);

    // Compare-and-set on updated_at so two people joining at once don't overwrite each other.
    let update = (db.from('group_orders') as any)
      .update({ participants })
      .eq('id', id)
      .eq('status', 'open');
    update = groupOrder.updated_at ? update.eq('updated_at', groupOrder.updated_at) : update;
    const { data: updated, error } = await update.select().maybeSingle();

    if (error) {
      console.error('Error updating group order:', error);
      return NextResponse.json({ error: 'Failed to update group order' }, { status: 500 });
    }
    if (!updated) {
      return NextResponse.json({ error: 'Someone else just updated this group order. Please try again.' }, { status: 409 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error in PUT /api/group-orders/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
