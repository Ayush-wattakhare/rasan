import { NextResponse } from 'next/server';
import {
  checkDateChangeable,
  loadOwnedSubscription,
  nextExtensionDate,
  notify,
  requireStatus,
  saveSubscription,
} from '@/lib/subscriptions/manage';

/**
 * Marks one scheduled delivery as an off-day and adds a replacement delivery
 * after the plan's last date (the customer keeps the meal they paid for).
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const loaded = await loadOwnedSubscription(id);
    if (!loaded.ok) return loaded.response;
    const { sub, userId } = loaded;

    const body = await request.json().catch(() => ({}));
    const targetDate = body?.date;
    const reason = typeof body?.reason === 'string' ? body.reason.slice(0, 200) : '';

    const statusError = requireStatus(sub, ['active'], 'Only active subscriptions can skip a day');
    if (statusError) return statusError.response;

    const dateError = checkDateChangeable(sub, targetDate);
    if (dateError) return dateError.response;

    const deliveries = sub.deliveries.map((d) => ({ ...d }));
    const index = deliveries.findIndex((d) => d.date === targetDate);
    if (index === -1) {
      return NextResponse.json({ error: 'No scheduled delivery found on this date' }, { status: 400 });
    }
    // Only a scheduled meal can be skipped. Skipping an already-skipped day used
    // to add another free replacement meal every time.
    if (deliveries[index].status !== 'scheduled') {
      return NextResponse.json(
        {
          error:
            deliveries[index].status === 'skipped'
              ? 'This day is already marked as an off-day'
              : 'This meal has already been delivered and cannot be skipped',
        },
        { status: 400 }
      );
    }

    const extensionDate = nextExtensionDate(sub, deliveries);
    if (!extensionDate) {
      return NextResponse.json(
        { error: 'No valid replacement delivery day found. Please contact support.' },
        { status: 409 }
      );
    }

    deliveries[index] = {
      ...deliveries[index],
      status: 'skipped',
      skip_reason: reason || 'Customer marked Off-Day',
      skipped_at: new Date().toISOString(),
    };
    deliveries.push({
      date: extensionDate,
      status: 'scheduled',
      order_id: null,
      is_extended: true,
      replaced_date: targetDate,
    });

    const saved = await saveSubscription(sub, { deliveries, end_date: extensionDate });
    if (!saved.ok) return saved.response;

    await notify(userId, {
      type: 'system',
      title: 'Off-Day Registered (+1 Day Extended)',
      message: `Your meal for ${targetDate} is skipped. A replacement meal is scheduled on ${extensionDate}.`,
      data: { subscription_id: id, skipped_date: targetDate, extended_date: extensionDate },
    });
    await notify(sub.vendors?.user_id, {
      type: 'order',
      title: 'Customer Off-Day Notice',
      message: `A subscriber skipped ${targetDate}. Do not prepare their meal that day.`,
      data: { subscription_id: id, date: targetDate },
    });

    return NextResponse.json({
      success: true,
      message: `Off-day confirmed for ${targetDate}. Subscription extended to ${extensionDate}!`,
      subscription: saved.subscription,
      extendedDate: extensionDate,
    });
  } catch (error) {
    console.error('Error in POST /api/subscriptions/[id]/skip-day:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
