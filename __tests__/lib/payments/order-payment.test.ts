/**
 * @jest-environment node
 */
import { createHmac } from 'crypto';
import { hmacSha256Hex, signaturesMatch, toMinorUnits } from '@/lib/payments/order-payment';
import { generateDeliveryOtp, verifyDeliveryOtp } from '@/lib/utils/delivery-otp-server';
import { getDeliveryOtp, withoutDeliveryOtp } from '@/lib/utils/delivery-otp';

jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

describe('payment signatures', () => {
  const secret = 'test_secret';

  it('matches a Razorpay-style order|payment signature', () => {
    const expected = createHmac('sha256', secret).update('order_1|pay_1').digest('hex');
    expect(hmacSha256Hex(secret, 'order_1|pay_1')).toBe(expected);
    expect(signaturesMatch(expected, expected)).toBe(true);
  });

  it('rejects a signature for a different gateway order', () => {
    const forOrder1 = hmacSha256Hex(secret, 'order_1|pay_1');
    const forOrder2 = hmacSha256Hex(secret, 'order_2|pay_1');
    expect(signaturesMatch(forOrder2, forOrder1)).toBe(false);
  });

  it('rejects empty or wrong-length signatures without throwing', () => {
    const expected = hmacSha256Hex(secret, 'x');
    expect(signaturesMatch(expected, '')).toBe(false);
    expect(signaturesMatch(expected, 'abc')).toBe(false);
  });

  it('converts rupees to paise without float drift', () => {
    expect(toMinorUnits(19.99)).toBe(1999);
    expect(toMinorUnits(0.1 + 0.2)).toBe(30);
  });
});

describe('delivery OTP', () => {
  it('generates 4-digit PINs', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateDeliveryOtp()).toMatch(/^[1-9]\d{3}$/);
    }
  });

  it('verifies only the stored PIN', () => {
    const order = { delivery_address: { delivery_otp: '4821' } };
    expect(verifyDeliveryOtp(order, '4821')).toBe(true);
    expect(verifyDeliveryOtp(order, ' 4821 ')).toBe(true);
    expect(verifyDeliveryOtp(order, '1234')).toBe(false);
  });

  it('has no derived fallback when no PIN is stored', () => {
    const order = { id: 'abc', order_number: 'ORD-20261010-1234', delivery_address: {} } as any;
    expect(getDeliveryOtp(order)).toBeNull();
    expect(verifyDeliveryOtp(order, '1234')).toBe(false);
  });

  it('strips the PIN before orders are shared with riders or kitchens', () => {
    const order = { id: '1', delivery_address: { street: 'MG Road', delivery_otp: '4821' } };
    const shared = withoutDeliveryOtp(order);
    expect(shared.delivery_address).toEqual({ street: 'MG Road' });
    expect(order.delivery_address.delivery_otp).toBe('4821');
  });
});
