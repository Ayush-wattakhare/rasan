import { createServiceClient } from '@/lib/supabase/server';

export type AvailabilityResult =
  | { ok: true; partner: any }
  | { ok: false; status: number; error: string };

/**
 * Sets the caller's own rider row online / offline. Going online requires an
 * admin-verified rider; going offline is always allowed. `partnerId`, if
 * given, must be the caller's own row.
 */
export async function setRiderOnline(
  userId: string,
  isOnline: boolean,
  partnerId?: unknown
): Promise<AvailabilityResult> {
  const db = createServiceClient();
  const { data: partner } = await db
    .from('delivery_partners')
    .select('id, user_id, is_verified')
    .eq('user_id', userId)
    .maybeSingle();

  if (!partner) return { ok: false, status: 404, error: 'Delivery partner record not found' };
  if (partnerId !== undefined && partnerId !== null && partnerId !== partner.id) {
    return { ok: false, status: 403, error: 'Forbidden' };
  }
  if (isOnline && !partner.is_verified) {
    return { ok: false, status: 403, error: 'Your rider account is awaiting admin verification' };
  }

  const { data: updated, error } = await db
    .from('delivery_partners')
    .update({ is_online: isOnline, updated_at: new Date().toISOString() })
    .eq('id', partner.id)
    .select()
    .maybeSingle();

  if (error || !updated) {
    console.error('setRiderOnline failed:', error);
    return { ok: false, status: 500, error: 'Failed to update online status' };
  }
  return { ok: true, partner: updated };
}
