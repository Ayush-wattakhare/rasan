import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/guards';
import { setRiderOnline } from '@/lib/delivery/availability';

/** Rider goes online / offline. Only verified riders can go online. */
export async function POST(request: NextRequest) {
  const auth = await requireRole('delivery');
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const { deliveryPartnerId, isOnline } = body ?? {};

    if (typeof isOnline !== 'boolean') {
      return NextResponse.json({ error: 'Online status is required' }, { status: 400 });
    }

    const result = await setRiderOnline(auth.user.id, isOnline, deliveryPartnerId);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    return NextResponse.json({
      success: true,
      message: `Status updated to ${isOnline ? 'online' : 'offline'}`,
      isOnline,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Toggle online error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
