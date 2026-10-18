import { addDaysISO, istToday, isISODate, weekdayOf } from '@/lib/utils/ist-date';

/**
 * Single source of truth for subscription schedules. The cart, the order API
 * and the subscription API all count meals with these functions, so the price
 * a customer pays always matches the meals that get scheduled.
 */

export type SchedulablePlan = 'daily' | 'weekly' | 'monthly';

/** Plan length in calendar days, inclusive of the start date. */
export const PLAN_LENGTH_DAYS: Record<SchedulablePlan, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

/** How far ahead a plan may start. */
export const MAX_PLAN_START_DAYS_AHEAD = 30;

const VALID_DAYS = new Set(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);

export function normalizeDeliveryDays(days: unknown): string[] {
  if (!Array.isArray(days)) return [];
  return Array.from(new Set(days.map((d) => String(d).toLowerCase()).filter((d) => VALID_DAYS.has(d))));
}

/** The default first delivery day for a new plan: tomorrow in IST. */
export function defaultPlanStart(now: Date = new Date()): string {
  return addDaysISO(istToday(now), 1);
}

/** True if `start` is between tomorrow (IST) and MAX_PLAN_START_DAYS_AHEAD days out. */
export function isValidPlanStart(start: unknown, now: Date = new Date()): start is string {
  if (!isISODate(start)) return false;
  const today = istToday(now);
  return start > today && start <= addDaysISO(today, MAX_PLAN_START_DAYS_AHEAD);
}

/** Last calendar day of the plan (inclusive). */
export function planEndDate(planType: SchedulablePlan, start: string): string {
  return addDaysISO(start, PLAN_LENGTH_DAYS[planType] - 1);
}

/** Every delivery date of the plan, in order. */
export function planDates(planType: SchedulablePlan, start: string, deliveryDays: unknown): string[] {
  const days = new Set(normalizeDeliveryDays(deliveryDays));
  if (!isISODate(start) || days.size === 0) return [];
  const dates: string[] = [];
  for (let i = 0; i < PLAN_LENGTH_DAYS[planType]; i++) {
    const date = addDaysISO(start, i);
    if (days.has(weekdayOf(date))) dates.push(date);
  }
  return dates;
}

/** Selected weekdays between two dates, both inclusive (for older plans with stored dates). */
export function datesBetween(start: string, end: string, deliveryDays: unknown): string[] {
  const days = new Set(normalizeDeliveryDays(deliveryDays));
  if (!isISODate(start) || !isISODate(end) || end < start || days.size === 0) return [];
  const dates: string[] = [];
  for (let date = start; date <= end && dates.length < 400; date = addDaysISO(date, 1)) {
    if (days.has(weekdayOf(date))) dates.push(date);
  }
  return dates;
}

export function planMealCount(planType: SchedulablePlan, start: string, deliveryDays: unknown): number {
  return planDates(planType, start, deliveryDays).length;
}
