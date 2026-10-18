/**
 * Standalone subscription plan pricing, shared by the subscription dialog and
 * POST /api/subscriptions (which never trusts a client-sent price).
 *
 * Price follows the number of scheduled meals (plan-schedule.ts).
 */
import {
  PLAN_LENGTH_DAYS as SCHEDULE_LENGTH_DAYS,
  defaultPlanStart,
  planMealCount,
} from '@/lib/pricing/plan-schedule';

export type PlanType = 'daily' | 'weekly' | 'monthly';

export const PLAN_TYPES: readonly PlanType[] = ['daily', 'weekly', 'monthly'];
export const SUBSCRIPTION_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'all'] as const;

const BASE_MEAL_PRICES: Record<string, number> = {
  breakfast: 100,
  lunch: 150,
  dinner: 150,
  all: 350,
};

const PLAN_DISCOUNT_PCT: Record<PlanType, number> = {
  daily: 0,
  weekly: 20,
  monthly: 30,
};

/** Length of each plan in calendar days, inclusive of the start date. */
export const PLAN_LENGTH_DAYS: Record<PlanType, number> = SCHEDULE_LENGTH_DAYS;

export function calculateSubscriptionPricing(
  planType: string,
  mealType: string,
  deliveryDays: string[],
  startDate: string = defaultPlanStart()
) {
  const plan: PlanType = (PLAN_TYPES as readonly string[]).includes(planType) ? (planType as PlanType) : 'daily';
  const basePerMeal = BASE_MEAL_PRICES[mealType] || 150;
  const mealCount = planMealCount(plan, startDate, deliveryDays);
  const discountPct = PLAN_DISCOUNT_PCT[plan];

  const basePrice = basePerMeal * mealCount;
  const savings = Math.round((basePrice * discountPct) / 100);
  const finalPrice = Math.max(0, basePrice - savings);

  return {
    days: deliveryDays.length,
    /** Number of meals the plan delivers (kept as `multiplier` for existing callers). */
    multiplier: mealCount,
    mealCount,
    basePerMeal,
    basePrice,
    savings,
    finalPrice,
    discountPct,
  };
}
