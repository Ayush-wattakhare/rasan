import { createServiceClient } from '@/lib/supabase/server';

/**
 * Stock reservation and abandoned-checkout expiry (migration 008).
 *
 * If migration 008 hasn't been applied yet the RPCs don't exist; these helpers
 * then log once and carry on, so orders keep working (without reservation).
 */

const MISSING_FUNCTION_CODES = new Set(['PGRST202', '42883']);
let warnedMissing = false;

function isMissingFunction(error: { code?: string } | null): boolean {
  if (!error?.code || !MISSING_FUNCTION_CODES.has(error.code)) return false;
  if (!warnedMissing) {
    warnedMissing = true;
    console.error('[stock] migration 008 is not applied: stock reservation and order expiry are disabled');
  }
  return true;
}

export type ReserveResult =
  | { ok: true }
  | { ok: false; outOfStockMealId: string | null; message: string };

/** Atomically takes the order's quantities out of meals.stock. */
export async function reserveOrderStock(orderId: string): Promise<ReserveResult> {
  const { error } = await (createServiceClient() as any).rpc('reserve_order_stock', { p_order_id: orderId });
  if (!error || isMissingFunction(error)) return { ok: true };

  const match = /OUT_OF_STOCK:([0-9a-f-]{36})/i.exec(error.message || '');
  if (match) {
    return { ok: false, outOfStockMealId: match[1], message: 'Some items just sold out' };
  }
  console.error('[stock] reserve failed:', error);
  return { ok: false, outOfStockMealId: null, message: 'Could not reserve the items' };
}

/** Gives a cancelled / expired order's quantities back. Safe to call twice. */
export async function releaseOrderStock(orderId: string): Promise<void> {
  const { error } = await (createServiceClient() as any).rpc('release_order_stock', { p_order_id: orderId });
  if (error && !isMissingFunction(error)) console.error('[stock] release failed:', error);
}

/** Minutes an online order may wait for payment before it is cancelled. */
export const UNPAID_ORDER_TTL_MINUTES = 30;

/** Cancels online orders whose payment never completed. Returns how many. */
export async function expireUnpaidOrders(minutes = UNPAID_ORDER_TTL_MINUTES): Promise<number> {
  const { data, error } = await (createServiceClient() as any).rpc('expire_unpaid_orders', { p_minutes: minutes });
  if (error) {
    if (!isMissingFunction(error)) console.error('[stock] expire_unpaid_orders failed:', error);
    return 0;
  }
  return Number(data) || 0;
}

let lastSweep = 0;
/**
 * Runs the expiry at most once a minute per server instance. Called from busy
 * paths (placing an order, admin views) so stale orders clear even without cron.
 */
export async function sweepUnpaidOrders(): Promise<void> {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  await expireUnpaidOrders();
}
