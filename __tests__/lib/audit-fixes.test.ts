/**
 * @jest-environment node
 */
import { countsAsRevenue, netOrderValue, revenueSummary } from '@/lib/analytics/revenue';
import { cancellationPolicy } from '@/lib/orders/cancellation';
import { istPeriodStarts } from '@/lib/utils/ist-date';
import { razorpayConfigIssues } from '@/lib/payments/razorpay-client';

jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));
import { orderHasPlan, planStatusForOrder } from '@/lib/subscriptions/from-order';

describe('revenue rules', () => {
  const base = { total: 102, subtotal: 100, tax: 2, refunded_amount: 0 };

  it('counts only real money', () => {
    expect(countsAsRevenue({ ...base, status: 'delivered', payment_status: 'pending' })).toBe(true); // cash collected
    expect(countsAsRevenue({ ...base, status: 'preparing', payment_status: 'paid' })).toBe(true);
    expect(countsAsRevenue({ ...base, status: 'pending', payment_status: 'pending' })).toBe(false); // unpaid checkout
    expect(countsAsRevenue({ ...base, status: 'cancelled', payment_status: 'paid' })).toBe(false);
    expect(countsAsRevenue({ ...base, status: 'delivered', payment_status: 'refunded' })).toBe(false);
  });

  it('subtracts refunds and splits by the real commission', () => {
    expect(netOrderValue({ ...base, refunded_amount: 30, status: 'delivered', payment_status: 'paid' })).toBe(72);
    const summary = revenueSummary(
      [
        { ...base, status: 'delivered', payment_status: 'paid' },
        { ...base, status: 'cancelled', payment_status: 'paid' },
      ],
      0.07
    );
    expect(summary.orders).toBe(1);
    expect(summary.grossRevenue).toBe(102);
    expect(summary.vendorShare).toBe(93); // 93% of the ₹100 food value
    expect(summary.platformEarnings).toBe(9); // ₹7 commission + ₹2 platform fee
  });
});

describe('cancellation policy', () => {
  it('refunds by how far the kitchen got', () => {
    expect(cancellationPolicy('confirmed').percentage).toBe(100);
    expect(cancellationPolicy('preparing').percentage).toBe(50);
    expect(cancellationPolicy('out_for_delivery').percentage).toBe(0);
  });
});

describe('istPeriodStarts', () => {
  it('starts today at IST midnight, the week on Monday, the month on the 1st', () => {
    // Wed 22 Oct 2026, 02:00 IST = Tue 21 Oct 20:30 UTC
    const p = istPeriodStarts(new Date('2026-10-21T20:30:00Z'));
    expect(p.today).toBe('2026-10-21T18:30:00.000Z'); // 22 Oct 00:00 IST
    expect(p.week).toBe('2026-10-18T18:30:00.000Z'); // Mon 19 Oct 00:00 IST
    expect(p.month).toBe('2026-09-30T18:30:00.000Z'); // 1 Oct 00:00 IST
  });
});

describe('plans created with the order', () => {
  it('detects plan items', () => {
    expect(orderHasPlan([{ subscription_type: 'one-time' }])).toBe(false);
    expect(orderHasPlan([{ subscription_type: 'weekly' }])).toBe(true);
  });

  it('starts only when paid, or for confirmed cash orders', () => {
    expect(planStatusForOrder({ payment_status: 'pending', payment_method: 'upi', status: 'pending' }).status).toBe('pending_payment');
    expect(planStatusForOrder({ payment_status: 'paid', payment_method: 'upi', status: 'confirmed' }).status).toBe('active');
    expect(planStatusForOrder({ payment_status: 'pending', payment_method: 'cash', status: 'confirmed' }).status).toBe('active');
    expect(planStatusForOrder({ payment_status: 'pending', payment_method: 'cash', status: 'cancelled' }).status).toBe('pending_payment');
  });
});

describe('Razorpay configuration check', () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it('flags a missing webhook secret and mismatched keys', () => {
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_live_a';
    process.env.RAZORPAY_KEY_ID = 'rzp_test_b';
    process.env.RAZORPAY_KEY_SECRET = 's';
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    const issues = razorpayConfigIssues().join(' | ');
    expect(issues).toMatch(/RAZORPAY_WEBHOOK_SECRET/);
    expect(issues).toMatch(/different keys/);
    expect(issues).toMatch(/test vs live/);
  });

  it('is quiet when everything is set consistently', () => {
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_a';
    process.env.RAZORPAY_KEY_ID = 'rzp_test_a';
    process.env.RAZORPAY_KEY_SECRET = 's';
    process.env.RAZORPAY_WEBHOOK_SECRET = 'w';
    expect(razorpayConfigIssues()).toEqual([]);
  });
});
