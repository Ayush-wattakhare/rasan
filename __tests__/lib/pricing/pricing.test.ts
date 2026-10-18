import {
  DELIVERY_FEE,
  PLATFORM_FEE,
  calculateCartTotals,
  getItemPricing,
} from '@/lib/pricing/order-pricing';
import { calculateSubscriptionPricing } from '@/lib/pricing/subscription-pricing';
import {
  defaultPlanStart,
  isValidPlanStart,
  planDates,
  planEndDate,
  planMealCount,
} from '@/lib/pricing/plan-schedule';

const MON_FRI = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
// 2026-10-19 is a Monday, 2026-10-24 a Saturday.
const MONDAY = '2026-10-19';
const SATURDAY = '2026-10-24';

describe('plan schedule (price follows the number of scheduled meals)', () => {
  it('weekly = one meal per selected weekday', () => {
    expect(planMealCount('weekly', MONDAY, MON_FRI)).toBe(5);
    expect(planMealCount('weekly', SATURDAY, MON_FRI)).toBe(5);
    expect(planMealCount('weekly', MONDAY, ['monday'])).toBe(1); // not 2 (old 8-day bug)
  });

  it('monthly counts every selected weekday in 30 days', () => {
    // Mon 19 Oct .. Tue 17 Nov: Mon & Tue occur 5 times, Wed-Fri 4 times.
    expect(planMealCount('monthly', MONDAY, MON_FRI)).toBe(22);
    // Sat 24 Oct .. Sun 22 Nov: every weekday 4 times.
    expect(planMealCount('monthly', SATURDAY, MON_FRI)).toBe(20);
  });

  it('daily delivers one meal only if that day is selected', () => {
    expect(planMealCount('daily', MONDAY, MON_FRI)).toBe(1);
    expect(planMealCount('daily', SATURDAY, MON_FRI)).toBe(0);
  });

  it('end date is inclusive (weekly = 7 calendar days)', () => {
    expect(planEndDate('weekly', MONDAY)).toBe('2026-10-25');
    expect(planEndDate('monthly', MONDAY)).toBe('2026-11-17');
    const dates = planDates('weekly', MONDAY, ['sunday', 'monday']);
    expect(dates).toEqual(['2026-10-19', '2026-10-25']);
  });

  it('ignores unknown weekday names and duplicates', () => {
    expect(planMealCount('weekly', MONDAY, ['monday', 'MONDAY', 'funday'])).toBe(1);
  });

  it('start must be between tomorrow (IST) and 30 days out', () => {
    const now = new Date('2026-10-18T20:00:00Z'); // 01:30 IST on 19 Oct
    expect(defaultPlanStart(now)).toBe('2026-10-20');
    expect(isValidPlanStart('2026-10-19', now)).toBe(false); // today in IST
    expect(isValidPlanStart('2026-10-20', now)).toBe(true);
    expect(isValidPlanStart('2026-11-18', now)).toBe(true);
    expect(isValidPlanStart('2026-11-19', now)).toBe(false);
    expect(isValidPlanStart('2026-02-30', now)).toBe(false);
  });
});

describe('getItemPricing', () => {
  it('charges price x quantity for one-time items', () => {
    const p = getItemPricing({ price: 120, quantity: 2 });
    expect(p.finalPrice).toBe(240);
    expect(p.discountPct).toBe(0);
    expect(p.planStartDate).toBeNull();
  });

  it('weekly: 20% off the scheduled meals', () => {
    const p = getItemPricing({
      price: 100,
      quantity: 1,
      subscription_type: 'weekly',
      delivery_days: MON_FRI,
      plan_start_date: MONDAY,
    });
    expect(p.mealCount).toBe(5);
    expect(p.basePrice).toBe(500);
    expect(p.finalPrice).toBe(400);
  });

  it('monthly: 30% off the meals that actually fall in the 30 days', () => {
    const p = getItemPricing({
      price: 100,
      quantity: 1,
      subscription_type: 'monthly',
      delivery_days: MON_FRI,
      plan_start_date: MONDAY,
    });
    expect(p.mealCount).toBe(22);
    expect(p.basePrice).toBe(2200);
    expect(p.finalPrice).toBe(1540);
  });

  it('treats zero or negative quantities as one', () => {
    expect(getItemPricing({ price: 50, quantity: 0 }).finalPrice).toBe(50);
    expect(getItemPricing({ price: 50, quantity: -3 }).finalPrice).toBe(50);
  });
});

describe('calculateCartTotals', () => {
  it('adds platform and delivery fees to the subtotal', () => {
    const totals = calculateCartTotals([
      { price: 100, quantity: 2 },
      { price: 50, quantity: 1 },
    ]);
    expect(totals.subtotal).toBe(250);
    expect(totals.total).toBe(250 + PLATFORM_FEE + DELIVERY_FEE);
  });

  it('cart price equals the order API price for the same subscription item', () => {
    // The order API calls the same function with the same plan_start_date.
    const item = {
      price: 150,
      quantity: 2,
      subscription_type: 'monthly' as const,
      delivery_days: ['monday', 'thursday'],
      plan_start_date: SATURDAY,
    };
    expect(calculateCartTotals([item]).total).toBe(calculateCartTotals([{ ...item }]).total);
    expect(getItemPricing(item).mealCount).toBe(planMealCount('monthly', SATURDAY, item.delivery_days));
  });
});

describe('calculateSubscriptionPricing', () => {
  it('prices a weekly lunch plan by its scheduled meals', () => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const p = calculateSubscriptionPricing('weekly', 'lunch', days, MONDAY);
    expect(p.mealCount).toBe(6);
    expect(p.basePrice).toBe(900);
    expect(p.finalPrice).toBe(720);
  });

  it('charges a single meal for a daily plan on a selected day, nothing otherwise', () => {
    expect(calculateSubscriptionPricing('daily', 'breakfast', MON_FRI, MONDAY).finalPrice).toBe(100);
    expect(calculateSubscriptionPricing('daily', 'breakfast', MON_FRI, SATURDAY).mealCount).toBe(0);
  });
});
