import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { addDaysISO, daysBetweenISO, isISODate, istHour, istToday, weekdayOf } from '@/lib/utils/ist-date';
import { normalizeDeliveryDays } from '@/lib/pricing/plan-schedule';

/**
 * Shared rules for customer subscription changes (skip, unskip, swap, address,
 * pause, resume, cancel). Customers have no direct write access to
 * subscriptions (migration 006): routes check ownership here, then write with
 * the service role using an optimistic lock on `updated_at`.
 */

export type Delivery = {
  date: string;
  status: 'scheduled' | 'skipped' | 'delivered' | string;
  order_id?: string | null;
  is_extended?: boolean;
  replaced_date?: string | null;
  skip_reason?: string | null;
  skipped_at?: string | null;
  meal_override?: Record<string, unknown>;
  address_override?: Record<string, unknown>;
  [key: string]: unknown;
};

export type OwnedSubscription = {
  id: string;
  customer_id: string;
  status: string;
  meal_type: string | null;
  delivery_time: string | null;
  delivery_days: string[] | null;
  start_date: string;
  end_date: string;
  paused_at: string | null;
  updated_at: string;
  deliveries: Delivery[];
  vendors: { id: string; business_name: string; user_id: string | null } | null;
};

type Fail = { ok: false; response: NextResponse };
const fail = (status: number, error: string, extra?: Record<string, unknown>): Fail => ({
  ok: false,
  response: NextResponse.json({ error, ...extra }, { status }),
});

/** Authenticates the caller and loads their subscription (service role, ownership enforced). */
export async function loadOwnedSubscription(
  id: string
): Promise<{ ok: true; userId: string; sub: OwnedSubscription } | Fail> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail(401, 'Unauthorized');

  const { data, error } = await createServiceClient()
    .from('subscriptions')
    .select(
      'id, customer_id, status, meal_type, delivery_time, delivery_days, start_date, end_date, paused_at, updated_at, deliveries, vendors(id, business_name, user_id)'
    )
    .eq('id', id)
    .eq('customer_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('loadOwnedSubscription error:', error);
    return fail(500, 'Failed to load subscription');
  }
  if (!data) return fail(404, 'Subscription not found');

  const sub = data as unknown as OwnedSubscription;
  sub.deliveries = Array.isArray(sub.deliveries) ? sub.deliveries : [];
  return { ok: true, userId: user.id, sub };
}

function isDinnerPlan(sub: Pick<OwnedSubscription, 'meal_type' | 'delivery_time'>): boolean {
  const mealType = (sub.meal_type || '').toLowerCase();
  const time = (sub.delivery_time || '').toLowerCase();
  const hour = parseInt(time, 10);
  return mealType.includes('dinner') || (time.includes('pm') && hour >= 6 && hour <= 11);
}

/** Same-day change cutoff (IST): lunch 08:00, dinner 15:00. */
export function cutoffFor(sub: Pick<OwnedSubscription, 'meal_type' | 'delivery_time'>) {
  const dinner = isDinnerPlan(sub);
  return { hour: dinner ? 15 : 8, label: dinner ? '3:00 PM' : '8:00 AM', meal: dinner ? 'dinner' : 'lunch' };
}

/**
 * Checks that `date` can still be changed: a real date, not in the past, and
 * (for today) before the kitchen's cutoff. Returns an error response or null.
 */
export function checkDateChangeable(
  sub: Pick<OwnedSubscription, 'meal_type' | 'delivery_time'>,
  date: unknown,
  now: Date = new Date()
): Fail | null {
  if (!isISODate(date)) return fail(400, 'A valid date (YYYY-MM-DD) is required');
  const today = istToday(now);
  if (date < today) return fail(400, 'Past deliveries cannot be changed');
  if (date === today) {
    const cutoff = cutoffFor(sub);
    if (istHour(now) >= cutoff.hour) {
      return fail(
        400,
        `Same-day cutoff (${cutoff.label}) has passed for today's ${cutoff.meal}. The home chef has already started cooking.`,
        { cutoffPassed: true }
      );
    }
  }
  return null;
}

/** Status must be one of `allowed`, else a 400 with `message`. */
export function requireStatus(sub: OwnedSubscription, allowed: string[], message: string): Fail | null {
  return allowed.includes(sub.status) ? null : fail(400, message);
}

/** Next selected weekday strictly after the last delivery (or end date). */
export function nextExtensionDate(sub: OwnedSubscription, deliveries: Delivery[]): string | null {
  const days = new Set(normalizeDeliveryDays(sub.delivery_days));
  if (days.size === 0) return null;
  const last = deliveries.reduce((max, d) => (d.date > max ? d.date : max), sub.end_date);
  for (let i = 1; i <= 14; i++) {
    const candidate = addDaysISO(last, i);
    if (days.has(weekdayOf(candidate))) return candidate;
  }
  return null;
}

export function lastDeliveryDate(deliveries: Delivery[], fallback: string): string {
  return deliveries.reduce((max, d) => (d.date > max ? d.date : max), '') || fallback;
}

/**
 * Writes changes only if nobody else changed the subscription since it was
 * loaded (optimistic lock on updated_at). Returns the updated row or a 409.
 */
export async function saveSubscription(
  sub: OwnedSubscription,
  changes: Record<string, unknown>
): Promise<{ ok: true; subscription: any } | Fail> {
  const { data, error } = await createServiceClient()
    .from('subscriptions')
    .update({ ...changes, updated_at: new Date().toISOString() } as any)
    .eq('id', sub.id)
    .eq('customer_id', sub.customer_id)
    .eq('updated_at', sub.updated_at)
    .select('*, vendors(id, business_name)')
    .maybeSingle();

  if (error) {
    console.error('saveSubscription error:', error);
    return fail(500, 'Failed to update subscription');
  }
  if (!data) return fail(409, 'This subscription was just updated elsewhere. Please refresh and try again.');
  return { ok: true, subscription: data };
}

/** Best-effort in-app notification. */
export async function notify(userId: string | null | undefined, n: {
  type: 'system' | 'order';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}) {
  if (!userId) return;
  try {
    await createServiceClient().from('notifications').insert({ user_id: userId, is_read: false, ...n } as any);
  } catch {
    // Notifications are best-effort.
  }
}

export { daysBetweenISO, istToday };
