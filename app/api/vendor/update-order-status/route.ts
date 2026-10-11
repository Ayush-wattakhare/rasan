import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { transitionOrder } from '@/lib/orders/transition';

export async function POST(request: NextRequest) {
  const auth = await requireRole('vendor');
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { orderId, status } = body ?? {};

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing orderId or status' }, { status: 400 });
    }

    // Only the order's own kitchen, only allowed transitions (lib/orders/transition).
    const result = await transitionOrder({ orderId, actor: 'vendor', userId: auth.user.id, status });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      order: result.order,
      data: { order: result.order },
    });
  } catch (error) {
    console.error('Vendor order status error:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
