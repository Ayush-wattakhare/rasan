import { createServiceClient } from '@/lib/supabase/server';
import { getRazorpay } from '@/lib/payments/razorpay-client';
import { toMinorUnits } from '@/lib/payments/order-payment';

/**
 * Customer refunds through Razorpay, recorded in refunds_ledger.
 *
 * Every refund is written to the ledger as 'pending' BEFORE the gateway call,
 * keyed by a deterministic reference, so a retry (double click, webhook retry,
 * concurrent cancel) finds the same row instead of refunding twice. The row is
 * then updated with the Razorpay refund id and its status; refund.processed /
 * refund.failed webhooks move it to its final state.
 */

export type RefundOutcome =
  | {
      ok: true;
      /** Rupees actually sent to the gateway (0 when nothing was refundable). */
      amount: number;
      status: 'processed' | 'pending';
      referenceId: string;
      gatewayRefundId: string | null;
      alreadyRequested?: boolean;
    }
  | {
      ok: false;
      /** not-paid: nothing was charged online, so there is nothing to refund. */
      reason: 'not-paid' | 'nothing-left' | 'not-configured' | 'gateway-error' | 'not-found' | 'db-error';
      message: string;
      referenceId?: string;
      /** Row left in the ledger for an admin to act on. */
      queued?: boolean;
    };

export interface RefundRequest {
  orderId: string;
  /** Rupees. Capped at what is still refundable on the order. */
  amount: number;
  reason: string;
  /** Deterministic key per refund intent, e.g. `CANCEL-<orderId>`. */
  referenceId: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** What can still be refunded on an order paid online. */
export function refundableAmount(order: {
  total: number | string | null;
  refunded_amount?: number | string | null;
}): number {
  return Math.max(0, round2(Number(order.total || 0) - Number(order.refunded_amount || 0)));
}

/** Clamps a requested refund to [0, refundable]. */
export function clampRefund(requested: unknown, refundable: number): number {
  const n = Number(requested);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return round2(Math.min(n, refundable));
}

export async function refundOrderPayment(req: RefundRequest): Promise<RefundOutcome> {
  const db = createServiceClient();

  const { data: order } = await (db.from('orders') as any)
    .select('id, order_number, customer_id, total, payment_status, payment_method, payment_id, refunded_amount, profiles:customer_id(name)')
    .eq('id', req.orderId)
    .maybeSingle();
  if (!order) return { ok: false, reason: 'not-found', message: 'Order not found' };

  const paidOnline =
    order.payment_method !== 'cash' &&
    !!order.payment_id &&
    ['paid', 'refunded'].includes(order.payment_status);
  if (!paidOnline) {
    return { ok: false, reason: 'not-paid', message: 'No online payment was collected for this order' };
  }

  // Same intent already recorded: report it, never refund twice.
  const { data: existing } = await (db.from('refunds_ledger' as any) as any)
    .select('reference_id, amount, status, gateway_refund_id')
    .eq('reference_id', req.referenceId)
    .maybeSingle();
  if (existing && existing.status !== 'failed') {
    return {
      ok: true,
      amount: Number(existing.amount),
      status: existing.status === 'processed' ? 'processed' : 'pending',
      referenceId: existing.reference_id,
      gatewayRefundId: existing.gateway_refund_id ?? null,
      alreadyRequested: true,
    };
  }

  const amount = clampRefund(req.amount, refundableAmount(order));
  if (amount <= 0) {
    return { ok: false, reason: 'nothing-left', message: 'This order has nothing left to refund' };
  }

  const ledgerRow = {
    reference_id: req.referenceId,
    order_id: order.id,
    order_number: order.order_number ?? null,
    recipient_id: order.customer_id ?? null,
    recipient_role: 'customer',
    recipient_name: order.profiles?.name || 'Customer',
    amount,
    type: 'customer_refund',
    reason: req.reason.slice(0, 500),
    status: 'pending',
    gateway: 'razorpay',
    payment_id: order.payment_id,
    failure_reason: null,
    processed_at: null,
    updated_at: new Date().toISOString(),
  };

  // A failed earlier attempt with the same key is retried in place.
  const { error: ledgerError } = existing
    ? await (db.from('refunds_ledger' as any) as any).update(ledgerRow).eq('reference_id', req.referenceId).eq('status', 'failed')
    : await (db.from('refunds_ledger' as any) as any).insert(ledgerRow);
  if (ledgerError) {
    // Unique violation: a concurrent request is handling this exact refund.
    if (ledgerError.code === '23505') {
      return {
        ok: true,
        amount,
        status: 'pending',
        referenceId: req.referenceId,
        gatewayRefundId: null,
        alreadyRequested: true,
      };
    }
    console.error('[refunds] ledger insert failed:', ledgerError);
    return { ok: false, reason: 'db-error', message: 'Could not record the refund' };
  }

  const razorpay = getRazorpay();
  if (!razorpay) {
    // Left as 'pending' in the ledger for an admin to refund manually.
    return {
      ok: false,
      reason: 'not-configured',
      message: 'Online refunds are not configured. The refund was queued for manual processing.',
      referenceId: req.referenceId,
      queued: true,
    };
  }

  try {
    const refund = await razorpay.payments.refund(order.payment_id, {
      amount: toMinorUnits(amount),
      speed: 'normal',
      receipt: req.referenceId.slice(0, 40),
      notes: { order_id: order.id, reference_id: req.referenceId },
    });

    const status = refund.status === 'processed' ? 'processed' : 'pending';
    await (db.from('refunds_ledger' as any) as any)
      .update({
        gateway_refund_id: refund.id,
        status,
        processed_at: status === 'processed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('reference_id', req.referenceId);

    await addRefundToOrder(order.id, amount);

    return { ok: true, amount, status, referenceId: req.referenceId, gatewayRefundId: refund.id };
  } catch (err: any) {
    const message: string =
      err?.error?.description || err?.message || 'Razorpay rejected the refund';
    console.error('[refunds] Razorpay refund failed:', message);
    await (db.from('refunds_ledger' as any) as any)
      .update({ status: 'failed', failure_reason: message.slice(0, 500), updated_at: new Date().toISOString() })
      .eq('reference_id', req.referenceId);
    return { ok: false, reason: 'gateway-error', message, referenceId: req.referenceId, queued: true };
  }
}

/**
 * Adds a refund to orders.refunded_amount (compare-and-set so concurrent refunds
 * both count) and marks the order 'refunded' once fully refunded.
 */
async function addRefundToOrder(orderId: string, amount: number): Promise<void> {
  const db = createServiceClient();
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: current } = await (db.from('orders') as any)
      .select('total, refunded_amount')
      .eq('id', orderId)
      .maybeSingle();
    if (!current) return;
    const total = Number(current.total || 0);
    const before = Number(current.refunded_amount || 0);
    const after = round2(Math.min(Math.max(before + amount, 0), total));
    // Fully refunded -> 'refunded'; a failed refund that undoes it -> back to 'paid'.
    const statusChange =
      after >= total ? { payment_status: 'refunded' } : before >= total ? { payment_status: 'paid' } : {};
    const { data: updated } = await (db.from('orders') as any)
      .update({
        refunded_amount: after,
        ...statusChange,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('refunded_amount', current.refunded_amount ?? 0)
      .select('id')
      .maybeSingle();
    if (updated) return;
  }
  console.error(`[refunds] could not record refunded_amount on order ${orderId}`);
}

/** Applies refund.processed / refund.failed webhook events to the ledger. */
export async function applyRefundWebhook(event: string, refund: any): Promise<void> {
  if (!refund?.id) return;
  const db = createServiceClient();
  if (event === 'refund.processed') {
    await (db.from('refunds_ledger' as any) as any)
      .update({ status: 'processed', processed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('gateway_refund_id', refund.id);
  } else if (event === 'refund.failed') {
    const { data: row } = await (db.from('refunds_ledger' as any) as any)
      .update({ status: 'failed', failure_reason: 'Razorpay reported the refund as failed', updated_at: new Date().toISOString() })
      .eq('gateway_refund_id', refund.id)
      .neq('status', 'failed')
      .select('order_id, amount')
      .maybeSingle();
    // The money did not go back: undo it on the order so it can be refunded again.
    if (row?.order_id) await addRefundToOrder(row.order_id, -Number(row.amount || 0));
  }
}

/**
 * Refunds a captured payment that cannot be applied to its order (order
 * cancelled meanwhile, already paid by another payment, amount mismatch).
 * Full refund of that payment; idempotent per payment id.
 */
export async function refundStrayPayment(params: {
  paymentId: string;
  /** Captured amount in paise, as reported by Razorpay. */
  amountMinor: number;
  order: { id: string; order_number?: string | null; customer_id?: string | null; customer_name?: string | null } | null;
  reason: string;
}): Promise<{ ok: boolean; message: string }> {
  const db = createServiceClient();
  const referenceId = `AUTO-${params.paymentId}`;
  const amount = round2(params.amountMinor / 100);
  if (!(amount > 0)) return { ok: false, message: 'Nothing to refund' };

  const { data: existing } = await (db.from('refunds_ledger' as any) as any)
    .select('status, gateway_refund_id')
    .eq('reference_id', referenceId)
    .maybeSingle();
  if (existing && (existing.gateway_refund_id || existing.status === 'processed')) {
    return { ok: true, message: 'Already refunded' };
  }

  if (!existing) {
    const { error } = await (db.from('refunds_ledger' as any) as any).insert({
      reference_id: referenceId,
      order_id: params.order?.id ?? null,
      order_number: params.order?.order_number ?? null,
      recipient_id: params.order?.customer_id ?? null,
      recipient_role: 'customer',
      recipient_name: params.order?.customer_name || 'Customer',
      amount,
      type: 'customer_refund',
      reason: params.reason.slice(0, 500),
      status: 'pending',
      gateway: 'razorpay',
      payment_id: params.paymentId,
      processed_at: null,
    });
    if (error && error.code !== '23505') {
      console.error('[refunds] stray payment ledger insert failed:', error);
    }
  }

  const razorpay = getRazorpay();
  if (!razorpay) return { ok: false, message: 'Queued for manual refund (Razorpay not configured)' };

  try {
    const refund = await razorpay.payments.refund(params.paymentId, {
      amount: params.amountMinor,
      speed: 'normal',
      receipt: referenceId.slice(0, 40),
      notes: { reason: params.reason.slice(0, 200), order_id: params.order?.id ?? '' },
    });
    await (db.from('refunds_ledger' as any) as any)
      .update({
        gateway_refund_id: refund.id,
        status: refund.status === 'processed' ? 'processed' : 'pending',
        processed_at: refund.status === 'processed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('reference_id', referenceId);
    return { ok: true, message: 'Refund issued' };
  } catch (err: any) {
    const message: string = err?.error?.description || err?.message || 'Razorpay rejected the refund';
    await (db.from('refunds_ledger' as any) as any)
      .update({ status: 'failed', failure_reason: message.slice(0, 500), updated_at: new Date().toISOString() })
      .eq('reference_id', referenceId);
    console.error('[refunds] stray payment refund failed:', message);
    return { ok: false, message };
  }
}
