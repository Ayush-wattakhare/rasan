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
  if (!isPayableStatus(order.payment_status)) {
    return { error: 'Order is not awaiting payment', status: 409 as const };
  }
  return { order };
}

/**
 * Payment states from which an order can still be paid. 'failed' is included
 * because Razorpay lets the customer retry on the same gateway order after a
 * failed attempt; without it the retry's money was captured on an unpaid order.
 */
export const PAYABLE_PAYMENT_STATUSES = ['pending', 'failed'] as const;

export function isPayableStatus(status: unknown): boolean {
  return (PAYABLE_PAYMENT_STATUSES as readonly unknown[]).includes(status);
}

export type MarkPaidResult =
  | { ok: false }
  | { ok: true; changed: boolean; cancelled: boolean; alreadyPaidWith: string | null };

/**
 * Marks an order paid exactly once (only while it is still payable), moves a
 * pending order to confirmed, and activates a subscription waiting on it.
 * `changed` is false when nothing was updated: the caller must not report a
 * confirmation in that case (see `cancelled` / `alreadyPaidWith`).
 */
export async function markOrderPaid(orderId: string, paymentId: string): Promise<MarkPaidResult> {
  const serviceClient = createServiceClient();
  const { data: order } = await serviceClient
    .from('orders')
    .select('id, status, payment_status, payment_id')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return { ok: false };

  const { data: updated, error } = await serviceClient
    .from('orders')
    .update({
      payment_status: 'paid',
      payment_id: paymentId,
      ...(order.status === 'pending' ? { status: 'confirmed' as const } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .in('payment_status', [...PAYABLE_PAYMENT_STATUSES])
    .neq('status', 'cancelled')
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('markOrderPaid error:', error);
    return { ok: false };
  }

  if (updated) {
    // A subscription bought with this order starts once it is paid.
    const { error: subError } = await serviceClient
      .from('subscriptions')
      .update({ status: 'active', payment_status: 'paid', updated_at: new Date().toISOString() } as any)
      .eq('order_id', orderId)
      .eq('status', 'pending_payment' as any);
    if (subError) console.error('markOrderPaid subscription activation error:', subError);
  }

  return {
    ok: true,
    changed: !!updated,
    cancelled: order.status === 'cancelled',
    alreadyPaidWith: order.payment_status === 'paid' ? (order.payment_id as string | null) : null,
  };
}
