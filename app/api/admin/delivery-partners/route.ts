import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * Riders an admin can assign: verified partners with their online state and
 * how many deliveries they are carrying right now. GET ?online=1 for online only.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const db = createServiceClient();
  let query = (db.from('delivery_partners') as any)
    .select('id, user_id, vehicle_type, vehicle_number, is_online, is_verified, rating, total_deliveries, user:profiles(name, phone, is_active)')
    .eq('is_verified', true)
    .order('is_online', { ascending: false })
    .limit(200);
  if (request.nextUrl.searchParams.get('online') === '1') query = query.eq('is_online', true);

  const { data: partners, error } = await query;
  if (error) {
    console.error('Admin riders fetch failed:', error);
    return NextResponse.json({ error: 'Could not load riders' }, { status: 500 });
  }

  const ids = (partners || []).map((p: any) => p.id);
  const load = new Map<string, number>();
  if (ids.length > 0) {
    const { data: active } = await db
      .from('orders')
      .select('delivery_partner_id')
      .in('delivery_partner_id', ids)
      .in('status', ['picked_up', 'out_for_delivery']);
    for (const row of active || []) {
      const id = row.delivery_partner_id as string;
      load.set(id, (load.get(id) || 0) + 1);
    }
  }

  const riders = (partners || [])
    .filter((p: any) => p.user?.is_active !== false)
    .map((p: any) => ({
      id: p.id,
      user_id: p.user_id,
      name: p.user?.name || 'Rider',
      phone: p.user?.phone || null,
      vehicle: [p.vehicle_type, p.vehicle_number].filter(Boolean).join(' · ') || null,
      is_online: !!p.is_online,
      rating: p.rating == null ? null : Number(p.rating),
      total_deliveries: Number(p.total_deliveries || 0),
      active_missions: load.get(p.id) || 0,
    }));

  return NextResponse.json({ success: true, riders });
}
