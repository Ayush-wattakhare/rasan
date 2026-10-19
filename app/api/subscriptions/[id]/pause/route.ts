import { NextResponse } from 'next/server';
import { istToday } from '@/lib/utils/ist-date';
import { loadOwnedSubscription, notify, requireStatus, saveSubscription } from '@/lib/subscriptions/manage';

/** Pauses an active plan. Resume moves the paused days to the end of the plan. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const loaded = await loadOwnedSubscription(id);
    if (!loaded.ok) return loaded.response;
    const { sub, userId } = loaded;

    const statusError = requireStatus(sub, ['active'], 'Only active subscriptions can be paused');
    if (statusError) return statusError.response;

    const saved = await saveSubscription(sub, { status: 'paused', paused_at: istToday() });
    if (!saved.ok) return saved.response;

    await notify(userId, {
      type: 'system',
      title: 'Subscription Paused',
      message: 'Your subscription is paused. When you resume, the missed meals move to the end of your plan.',
      data: { subscription_id: id },
    });
    await notify(sub.vendors?.user_id, {
      type: 'order',
      title: 'Subscription Paused',
      message: 'A subscriber paused their plan. Their meals are on hold until they resume.',
      data: { subscription_id: id },
    });

    return NextResponse.json(saved.subscription);
  } catch (error) {
    console.error('Error in POST /api/subscriptions/[id]/pause:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
