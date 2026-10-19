import { NextResponse } from 'next/server';
import { loadOwnedSubscription, notify, requireStatus, saveSubscription } from '@/lib/subscriptions/manage';

/** Cancels a plan. Refunds for paid plans are handled by support (no automatic refund yet). */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const loaded = await loadOwnedSubscription(id);
    if (!loaded.ok) return loaded.response;
    const { sub, userId } = loaded;

    const statusError = requireStatus(
      sub,
      ['active', 'paused', 'pending_payment'],
      sub.status === 'cancelled' ? 'Subscription is already cancelled' : 'This subscription can no longer be cancelled'
    );
    if (statusError) return statusError.response;

    const saved = await saveSubscription(sub, { status: 'cancelled' });
    if (!saved.ok) return saved.response;

    await notify(userId, {
      type: 'system',
      title: 'Subscription Cancelled',
      message:
        'Your subscription has been cancelled and no further meals will be delivered. ' +
        'If you paid online, our team will review a refund for undelivered meals.',
      data: { subscription_id: id },
    });
    await notify(sub.vendors?.user_id, {
      type: 'order',
      title: 'Subscription Cancelled',
      message: 'A subscriber cancelled their plan. Remove them from upcoming prep lists.',
      data: { subscription_id: id },
    });

    return NextResponse.json(saved.subscription);
  } catch (error) {
    console.error('Error in POST /api/subscriptions/[id]/cancel:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
