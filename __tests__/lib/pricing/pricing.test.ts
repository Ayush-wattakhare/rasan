import {
  DELIVERY_FEE,
  PLATFORM_FEE,
  calculateCartTotals,
  getItemPricing,
} from '@/lib/pricing/order-pricing';
import { calculateSubscriptionPricing } from '@/lib/pricing/subscription-pricing';

describe('getItemPricing', () => {
  it('charges price x quantity for one-time items', () => {
    const p = getItemPricing({ price: 120, quantity: 2 });
    expect(p.finalPrice).toBe(240);
    expect(p.discountPct).toBe(0);
  });

  it('applies 20% off per delivery day for weekly plans', () => {
    const p = getItemPricing({
      price: 100,
      quantity: 1,
      subscription_type: 'weekly',
      delivery_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    });
    expect(p.basePrice).toBe(500);
    expect(p.finalPrice).toBe(400);
  });

  it('applies 30% off over four weeks for monthly plans', () => {
    const p = getItemPricing({
      price: 100,
      quantity: 1,
      subscription_type: 'monthly',
      delivery_days: ['monday', 'wednesday'],
    });
    expect(p.basePrice).toBe(800);
    expect(p.finalPrice).toBe(560);
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
});

describe('calculateSubscriptionPricing', () => {
  it('prices a weekly lunch plan from the base meal price', () => {
    const p = calculateSubscriptionPricing('weekly', 'lunch', 6);
    expect(p.basePrice).toBe(900);
    expect(p.finalPrice).toBe(720);
  });

  it('charges a single meal for daily plans', () => {
    expect(calculateSubscriptionPricing('daily', 'breakfast', 5).finalPrice).toBe(100);
  });
});
