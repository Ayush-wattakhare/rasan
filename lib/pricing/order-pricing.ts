import type { SubscriptionType } from '@/types';

/**
 * Order pricing shared by the cart UI and the order API.
 * The API recomputes every total from database meal prices with these
 * functions; amounts sent by the browser are never trusted.
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

export type PricingInput = {
  price: number;
  quantity: number;
  subscription_type?: SubscriptionType;
  delivery_days?: string[];
};

export function getItemPricing(item: PricingInput) {
  const subType: SubscriptionType = item.subscription_type || 'one-time';
  const price = Number(item.price) || 0;
  const quantity = Math.max(1, item.quantity || 1);
  const daysCount = Math.max(1, (item.delivery_days || []).length);

  let multiplier = 1;
  let cycleDescription = '1 meal';

  if (subType === 'weekly') {
    multiplier = daysCount; // Delivers on each selected day in the week
    cycleDescription = `${daysCount} meal${daysCount > 1 ? 's' : ''} (${daysCount} days/wk)`;
  } else if (subType === 'monthly') {
    multiplier = daysCount * 4; // 4 weeks of selected delivery days
    cycleDescription = `${daysCount * 4} meals (${daysCount} days/wk × 4 wks)`;
  }

  const discountPct = SUBSCRIPTION_DISCOUNT_PCT[subType] ?? 0;
  const basePrice = price * multiplier * quantity;
  const savings = Math.round((basePrice * discountPct) / 100);
  const finalPrice = Math.max(0, basePrice - savings);
  const pricePerMeal = multiplier > 0 ? finalPrice / (multiplier * quantity) : price;

  return {
    subType,
    daysCount,
    multiplier,
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
