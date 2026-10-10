/**
 * Standalone subscription plan pricing, shared by the subscription dialog and
 * POST /api/subscriptions (which never trusts a client-sent price).
 */

export type PlanType = 'daily' | 'weekly' | 'monthly';

export const PLAN_TYPES: readonly PlanType[] = ['daily', 'weekly', 'monthly'];
export const SUBSCRIPTION_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'all'] as const;

const BASE_MEAL_PRICES: Record<string, number> = {
  breakfast: 100,
  lunch: 150,
  dinner: 150,
  all: 350,
};

/** Length of each plan in days (end_date = start_date + this). */
export const PLAN_LENGTH_DAYS: Record<PlanType, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

export function calculateSubscriptionPricing(
  planType: string,
  mealType: string,
  deliveryDaysCount: number
) {
  const days = Math.max(1, deliveryDaysCount);
  const basePerMeal = BASE_MEAL_PRICES[mealType] || 150;

  let multiplier = 1;
  let discountPct = 0;

  if (planType === 'weekly') {
    discountPct = 20; // 20% discount for weekly
    multiplier = days;
  } else if (planType === 'monthly') {
    discountPct = 30; // 30% discount for monthly
    multiplier = days * 4;
  }

  const basePrice = basePerMeal * multiplier;
  const savings = Math.round((basePrice * discountPct) / 100);
  const finalPrice = Math.max(0, basePrice - savings);

  return {
    days,
    multiplier,
    basePerMeal,
    basePrice,
    savings,
    finalPrice,
    discountPct,
  };
}
