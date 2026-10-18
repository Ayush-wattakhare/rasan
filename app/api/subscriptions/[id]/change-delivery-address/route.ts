import { NextResponse } from 'next/server';
import { sanitizeDeliveryAddress } from '@/lib/utils/address';
import {
  checkDateChangeable,
  loadOwnedSubscription,
  notify,
  requireStatus,
  saveSubscription,
} from '@/lib/subscriptions/manage';

/** Redirects one scheduled delivery to a different address. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const loaded = await loadOwnedSubscription(id);
    if (!loaded.ok) return loaded.response;
    const { sub, userId } = loaded;

    const body = await request.json().catch(() => ({}));
    const targetDate = body?.date;
    const address = sanitizeDeliveryAddress(body?.address);
    if (!address) {
      return NextResponse.json(
        { error: 'Target date and complete address are required' },
        { status: 400 }
      );
    }

    const statusError = requireStatus(sub, ['active'], 'Addresses can only be changed on active subscriptions');
    if (statusError) return statusError.response;

    const dateError = checkDateChangeable(sub, targetDate);
    if (dateError) return dateError.response;

    const deliveries = sub.deliveries.map((d) => ({ ...d }));
    const index = deliveries.findIndex((d) => d.date === targetDate);
    if (index === -1) {
      return NextResponse.json({ error: 'Delivery date not found' }, { status: 400 });
    }
    if (deliveries[index].status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Can only update address on scheduled upcoming deliveries' },
        { status: 400 }
      );
    }

    deliveries[index] = {
      ...deliveries[index],
      address_override: address,
      address_updated_at: new Date().toISOString(),
    };

    const saved = await saveSubscription(sub, { deliveries });
    if (!saved.ok) return saved.response;

    await notify(userId, {
      type: 'system',
      title: 'Delivery Address Updated for Single Day',
      message: `Your meal for ${targetDate} will go to: ${address.street}${address.city ? `, ${address.city}` : ''}`,
      data: { subscription_id: id, date: targetDate },
    });
    await notify(sub.vendors?.user_id, {
      type: 'order',
      title: 'Subscriber Address Change',
      message: `A subscriber changed their delivery address for ${targetDate}.`,
      data: { subscription_id: id, date: targetDate },
    });

    return NextResponse.json({
      success: true,
      message: `Address updated for delivery on ${targetDate}`,
      subscription: saved.subscription,
    });
  } catch (error) {
    console.error('Error in POST /api/subscriptions/[id]/change-delivery-address:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
