import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { setRiderOnline } from '@/lib/delivery/availability';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole('delivery');
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { is_online } = body ?? {};

    if (typeof is_online !== 'boolean') {
      return NextResponse.json({ error: 'Invalid is_online value' }, { status: 400 });
    }

    const result = await setRiderOnline(auth.user.id, is_online, id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result.partner);
  } catch (error) {
    console.error('Error in PUT /api/delivery-partners/[id]/status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
