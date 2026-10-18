import { NextResponse } from 'next/server';
import {
  checkDateChangeable,
  lastDeliveryDate,
  loadOwnedSubscription,
  notify,
  requireStatus,
  saveSubscription,
} from '@/lib/subscriptions/manage';

/** Restores a skipped day and removes the replacement meal that was added for it. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const loaded = await loadOwnedSubscription(id);
    if (!loaded.ok) return loaded.response;
    const { sub, userId } = loaded;

    const body = await request.json().catch(() => ({}));
    const targetDate = body?.date;

    const statusError = requireStatus(
      sub,
      ['active', 'paused'],
      'Deliveries can only be restored on active or paused subscriptions'
    );
    if (statusError) return statusError.response;

    const dateError = checkDateChangeable(sub, targetDate);
    if (dateError) return dateError.response;

    const deliveries = sub.deliveries.map((d) => ({ ...d }));
    const index = deliveries.findIndex((d) => d.date === targetDate);
    if (index === -1) {
      return NextResponse.json({ error: 'Delivery date not found' }, { status: 400 });
    }
    if (deliveries[index].status !== 'skipped') {
      return NextResponse.json({ error: 'This date is not marked as skipped' }, { status: 400 });
    }

    // The replacement meal must not have been cooked/delivered already.
    const extensionIndex = deliveries.findIndex((d) => d.is_extended && d.replaced_date === targetDate);
    if (extensionIndex !== -1 && deliveries[extensionIndex].status !== 'scheduled') {
      return NextResponse.json(
        { error: 'The replacement meal for this day was already used, so it cannot be restored.' },
        { status: 409 }
      );
    }

    deliveries[index] = { ...deliveries[index], status: 'scheduled', skip_reason: null, skipped_at: null };
    if (extensionIndex !== -1) deliveries.splice(extensionIndex, 1);

    const saved = await saveSubscription(sub, {
      deliveries,
      end_date: lastDeliveryDate(deliveries, sub.end_date),
    });
    if (!saved.ok) return saved.response;

    await notify(userId, {
      type: 'system',
      title: 'Delivery Restored',
      message: `Your meal for ${targetDate} is back on the schedule.`,
      data: { subscription_id: id, date: targetDate },
    });
    await notify(sub.vendors?.user_id, {
      type: 'order',
      title: 'Off-Day Cancelled',
      message: `A subscriber restored their meal for ${targetDate}. Please prepare it as usual.`,
      data: { subscription_id: id, date: targetDate },
    });

    return NextResponse.json({
      success: true,
      message: `Delivery resumed for ${targetDate}`,
      subscription: saved.subscription,
    });
  } catch (error) {
    console.error('Error in POST /api/subscriptions/[id]/unskip-day:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
