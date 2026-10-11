import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { claimOrderForPartner } from '@/lib/orders/transition';

const MAX_BATCH = 5;

/**
 * Rider accepts (and picks up) one or more ready orders.
 * The rider is always the caller; any partner id in the body is ignored.
 */
export async function POST(request: NextRequest) {
  const auth = await requireRole('delivery');
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { orderId, orderIds: rawOrderIds } = body ?? {};

    const requested: string[] = Array.isArray(rawOrderIds) && rawOrderIds.length > 0
      ? rawOrderIds
      : orderId
      ? [orderId]
      : [];

    const orderIds = Array.from(new Set(requested.filter((id) => typeof id === 'string'))).slice(0, MAX_BATCH);
    if (orderIds.length === 0) {
      return NextResponse.json({ error: 'At least one Order ID is required' }, { status: 400 });
    }

    const accepted: string[] = [];
    const failed: { orderId: string; error: string }[] = [];

    for (const id of orderIds) {
      const result = await claimOrderForPartner({ orderId: id, userId: auth.user.id });
      if (result.ok) accepted.push(id);
      else failed.push({ orderId: id, error: result.error });
    }

    if (accepted.length === 0) {
      return NextResponse.json(
        { error: failed[0]?.error || 'Could not accept order', failed },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully accepted ${accepted.length} order(s)`,
      acceptedCount: accepted.length,
      orderIds: accepted,
      failed,
    });
  } catch (error) {
    console.error('Accept order unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
