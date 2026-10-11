import { createHmac, timingSafeEqual } from 'crypto';
import { createServiceClient } from '@/lib/supabase/server';

/** Amount in the smallest currency unit (paise / cents). */
export function toMinorUnits(amount: number): number {
  return Math.round(Number(amount) * 100);
}

/** Constant-time comparison of two hex signatures. */
export function signaturesMatch(expectedHex: string, receivedHex: string): boolean {
  const expected = Buffer.from(expectedHex, 'utf8');
  const received = Buffer.from(String(receivedHex || ''), 'utf8');
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function hmacSha256Hex(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/** Loads an order the customer can still pay for. */
export async function loadPayableOrder(orderId: string, customerId: string) {
  const { data: order } = await createServiceClient()
    .from('orders')
    .select('id, customer_id, total, status, payment_status, payment_method, payment_order_id')
    .eq('id', orderId)
    .eq('customer_id', customerId)
    .maybeSingle();

  if (!order) return { error: 'Order not found', status: 404 as const };
  if (order.status === 'cancelled') return { error: 'Order is cancelled', status: 409 as const };
  if (order.payment_status !== 'pending') {
    return { error: 'Order is not awaiting payment', status: 409 as const };
  }
  return { order };
}

/**
 * Marks an order paid exactly once (only while payment_status is still
 * 'pending'), and moves a pending order to confirmed.
 */
export async function markOrderPaid(orderId: string, paymentId: string) {
  const serviceClient = createServiceClient();
  const { data: order } = await serviceClient
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return { ok: false as const };

  const { data: updated, error } = await serviceClient
    .from('orders')
    .update({
      payment_status: 'paid',
      payment_id: paymentId,
      ...(order.status === 'pending' ? { status: 'confirmed' as const } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('payment_status', 'pending')
    .neq('status', 'cancelled')
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('markOrderPaid error:', error);
    return { ok: false as const };
  }
  return { ok: true as const, changed: !!updated };
}
