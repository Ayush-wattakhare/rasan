import { NextResponse } from 'next/server';
import {
  type Delivery,
  checkDateChangeable,
  istToday,
  loadOwnedSubscription,
  nextExtensionDate,
  notify,
  requireStatus,
  saveSubscription,
} from '@/lib/subscriptions/manage';

/**
 * Resumes a paused plan. Meals that fell inside the pause are marked as
 * skipped and the same number of meals is added after the plan's last date,
 * so the customer still gets everything they paid for.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const loaded = await loadOwnedSubscription(id);
    if (!loaded.ok) return loaded.response;
    const { sub, userId } = loaded;

    const statusError = requireStatus(sub, ['paused'], 'Only paused subscriptions can be resumed');
    if (statusError) return statusError.response;

    const today = istToday();
    const deliveries: Delivery[] = sub.deliveries.map((d) => ({ ...d }));

    // Meals missed during the pause: from paused_at up to today; today counts as
    // missed only if its same-day cutoff has already passed.
    const missedIndexes = sub.paused_at
      ? deliveries
          .map((d, i) => ({ d, i }))
          .filter(
            ({ d }) =>
              d.status === 'scheduled' &&
              d.date >= sub.paused_at! &&
              (d.date < today || (d.date === today && checkDateChangeable(sub, d.date) !== null))
          )
          .map(({ i }) => i)
      : [];

    if (missedIndexes.length === 0 && sub.end_date < today) {
      return NextResponse.json({ error: 'Subscription has expired' }, { status: 400 });
    }

    for (const i of missedIndexes) {
      deliveries[i] = {
        ...deliveries[i],
        status: 'skipped',
        skip_reason: 'Subscription paused',
        skipped_at: new Date().toISOString(),
      };
    }

    let endDate = sub.end_date;
    for (const i of missedIndexes) {
      const extension = nextExtensionDate({ ...sub, end_date: endDate }, deliveries);
      if (!extension) break;
      deliveries.push({
        date: extension,
        status: 'scheduled',
        order_id: null,
        is_extended: true,
        replaced_date: deliveries[i].date,
      });
      endDate = extension;
    }

    const saved = await saveSubscription(sub, {
      status: 'active',
      paused_at: null,
      deliveries,
      end_date: endDate,
    });
    if (!saved.ok) return saved.response;

    const moved = missedIndexes.length;
    await notify(userId, {
      type: 'system',
      title: 'Subscription Resumed',
      message: moved
        ? `Welcome back! ${moved} missed meal${moved === 1 ? '' : 's'} moved to the end of your plan (now ends ${endDate}).`
        : 'Your subscription has been resumed. Deliveries continue as scheduled.',
      data: { subscription_id: id, moved_meals: moved, end_date: endDate },
    });
    await notify(sub.vendors?.user_id, {
      type: 'order',
      title: 'Subscription Resumed',
      message: 'A subscriber resumed their plan. Their meals are back on your schedule.',
      data: { subscription_id: id },
    });

    return NextResponse.json(saved.subscription);
  } catch (error) {
    console.error('Error in POST /api/subscriptions/[id]/resume:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
