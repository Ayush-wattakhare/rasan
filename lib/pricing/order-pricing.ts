import type { SubscriptionType } from '@/types';
import { defaultPlanStart, planMealCount } from '@/lib/pricing/plan-schedule';

/**
 * Order pricing shared by the cart UI and the order API.
 * The API recomputes every total from database meal prices with these
 * functions; amounts sent by the browser are never trusted.
 *
 * Subscription items are priced per scheduled meal: the meal count comes from
 * the real delivery schedule (plan-schedule.ts), so customers pay for exactly
 * the meals that get delivered.
 */

export const PLATFORM_FEE = 2;
export const DELIVERY_FEE = 0;

export const SUBSCRIPTION_DISCOUNT_PCT: Record<SubscriptionType, number> = {
  'one-time': 0,
  weekly: 20,
  monthly: 30,
};

export const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

/** Default delivery days for a new cart item / plan (everyday). */
export const DEFAULT_DELIVERY_DAYS: string[] = [...WEEKDAYS];

export type PricingInput = {
  price: number;
  quantity: number;
  subscription_type?: SubscriptionType;
  delivery_days?: string[];
  /** First delivery date (YYYY-MM-DD, IST) for weekly / monthly items. */
  plan_start_date?: string;
};

function formatStart(date: string): string {
  // e.g. "Tue 21 Oct" (UTC on a date string, so it's the same everywhere)
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

export function getItemPricing(item: PricingInput) {
  const subType: SubscriptionType = item.subscription_type || 'one-time';
  const price = Math.round(Number(item.price) || 0);
  const quantity = Math.max(1, item.quantity || 1);
  const daysCount = Math.max(1, (item.delivery_days || []).length);
  const planStart = subType === 'one-time' ? null : item.plan_start_date || defaultPlanStart();

  let multiplier = 1;
  let cycleDescription = '1 meal';

  if (subType !== 'one-time' && planStart) {
    multiplier = planMealCount(subType, planStart, item.delivery_days);
    cycleDescription =
      `${multiplier} meal${multiplier === 1 ? '' : 's'} · ${daysCount} day${daysCount === 1 ? '' : 's'}/wk` +
      ` · starts ${formatStart(planStart)}`;
  }

  const discountPct = SUBSCRIPTION_DISCOUNT_PCT[subType] ?? 0;
  const basePrice = Math.round(price * multiplier * quantity);
  const savings = Math.round((basePrice * discountPct) / 100);
  const finalPrice = Math.max(0, basePrice - savings);
  const pricePerMeal = multiplier > 0 ? Math.round(finalPrice / (multiplier * quantity)) : price;

  return {
    subType,
    daysCount,
    multiplier,
    mealCount: multiplier,
    planStartDate: planStart,
    discountPct,
    basePrice,
    savings,
    finalPrice,
    pricePerMeal,
    cycleDescription,
  };
}

export function calculateCartTotals(items: PricingInput[]) {
  let baseSubtotal = 0;
  let totalSavings = 0;
  let subtotal = 0;

  for (const item of items) {
    const pricing = getItemPricing(item);
    baseSubtotal += pricing.basePrice;
    totalSavings += pricing.savings;
    subtotal += pricing.finalPrice;
  }

  return {
    base_subtotal: baseSubtotal,
    total_savings: totalSavings,
    subtotal,
    platform_fee: PLATFORM_FEE,
    delivery_fee: DELIVERY_FEE,
    total: subtotal + PLATFORM_FEE + DELIVERY_FEE,
  };
}
