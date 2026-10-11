import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/guards';
import { actorForRole, recordCashCollected, transitionOrder } from '@/lib/orders/transition';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return handleStatusUpdate(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handleStatusUpdate(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handleStatusUpdate(request, context);
}

/**
 * Status changes by the order's kitchen, its assigned rider, or an admin.
 * Customers cancel through /api/orders/[id]/cancel instead.
 *
 * Body: { status?, otp?, payment_status? }
 *   payment_status: 'paid' is only accepted from the assigned rider of a cash
 *   order (cash collected at the door).
 */
async function handleStatusUpdate(request: NextRequest, context: RouteContext) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { id: orderId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { status, otp, payment_status } = body ?? {};

    const actor = actorForRole(auth.role);
    if (!actor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (payment_status !== undefined) {
      if (actor !== 'delivery' || payment_status !== 'paid') {
        return NextResponse.json({ error: 'Payment status cannot be changed here' }, { status: 400 });
      }
      const collected = await recordCashCollected({ orderId, userId: auth.user.id });
      if (!collected.ok) {
        return NextResponse.json({ error: collected.error }, { status: collected.status });
      }
      if (!status) {
        return NextResponse.json({ success: true, data: { order: collected.order } });
      }
    }

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const result = await transitionOrder({ orderId, actor, userId: auth.user.id, status, otp });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order: result.order },
    });
  } catch (error) {
    console.error('Order status endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
