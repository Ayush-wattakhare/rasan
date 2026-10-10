import { randomInt, timingSafeEqual } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * Delivery handover codes live in `order_handover_codes` (migration 003),
 * readable only by the ordering customer. Riders and kitchens never see them.
 */

export function generateDeliveryOtp(): string {
  return randomInt(1000, 10000).toString();
}

/** Creates the handover code for a new order. Returns false if it could not be stored. */
export async function createHandoverCode(orderId: string): Promise<boolean> {
  const { error } = await createServiceClient()
    .from('order_handover_codes')
    .insert({ order_id: orderId, code: generateDeliveryOtp() });
  if (error) console.error('Handover code insert error:', error);
  return !error;
}

export function codesMatch(expected: string | null | undefined, entered: unknown): boolean {
  if (!expected || entered === undefined || entered === null) return false;
  const a = Buffer.from(String(entered).trim());
  const b = Buffer.from(String(expected).trim());
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function verifyHandoverCode(orderId: string, entered: unknown): Promise<boolean> {
  const { data } = await createServiceClient()
    .from('order_handover_codes')
    .select('code')
    .eq('order_id', orderId)
    .maybeSingle();
  return codesMatch(data?.code, entered);
}
