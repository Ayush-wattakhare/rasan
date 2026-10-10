import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { claimOrderForPartner } from '@/lib/orders/transition';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole('delivery');
  if (!auth.ok) return auth.response;

  try {
    const { id: orderId } = await params;
    const result = await claimOrderForPartner({ orderId, userId: auth.user.id });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.order);
  } catch (error) {
    console.error('Error in POST /api/delivery-partners/orders/[id]/accept:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
