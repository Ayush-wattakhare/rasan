import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { transitionOrder } from '@/lib/orders/transition';

const RIDER_STATUSES = ['picked_up', 'out_for_delivery', 'delivered'];

/**
 * Assigned rider moves their order along: picked_up → out_for_delivery →
 * delivered (delivered requires the customer's 4-digit PIN).
 */
export async function POST(request: NextRequest) {
  const auth = await requireRole('delivery');
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { orderId, status, otp } = body ?? {};

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 });
    }
    if (!RIDER_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const result = await transitionOrder({
      orderId,
      actor: 'delivery',
      userId: auth.user.id,
      status,
      otp,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order: result.order },
    });
  } catch (error) {
    console.error('Delivery status update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
