/**
 * @jest-environment node
 */
import { addDaysISO, istHour, istTimeHHMM, istToday, weekdayOf, isISODate } from '@/lib/utils/ist-date';
import { parsePageParam, sanitizeSearch } from '@/lib/utils/search';
import { sniffImageType } from '@/lib/utils/image-upload';
import { isUuid } from '@/lib/utils/validation-ids';
import { sanitizeAddressFields, sanitizeDeliveryAddress } from '@/lib/utils/address';
import { checkDiscount, validateMealInput } from '@/lib/validation/meal';
import { isPayableStatus } from '@/lib/payments/order-payment';

jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn(), createClient: jest.fn() }));

describe('ist-date', () => {
  it('uses India time, not UTC', () => {
    // 20:00 UTC = 01:30 IST next day
    const now = new Date('2026-10-18T20:00:00Z');
    expect(istToday(now)).toBe('2026-10-19');
    expect(istHour(now)).toBe(1);
    expect(istTimeHHMM(now)).toBe('01:30');
  });

  it('does calendar math on date strings', () => {
    expect(addDaysISO('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysISO('2026-03-01', -1)).toBe('2026-02-28');
    expect(weekdayOf('2026-10-19')).toBe('monday');
    expect(isISODate('2026-02-29')).toBe(false);
    expect(isISODate('2028-02-29')).toBe(true);
  });
});

describe('search helpers', () => {
  it('strips PostgREST filter syntax from search text', () => {
    expect(sanitizeSearch('dal, rice')).toBe('dal rice');
    expect(sanitizeSearch('a(b)c*%\\')).toBe('a b c');
    expect(sanitizeSearch(undefined)).toBe('');
    expect(sanitizeSearch('x'.repeat(200))).toHaveLength(64);
  });

  it('parses ?page= safely', () => {
    expect(parsePageParam('3')).toBe(3);
    expect(parsePageParam('abc')).toBe(1);
    expect(parsePageParam('0')).toBe(1);
    expect(parsePageParam('-2')).toBe(1);
    expect(parsePageParam(undefined)).toBe(1);
  });
});

describe('sniffImageType', () => {
  const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)]);
  it('detects real image formats from bytes', () => {
    expect(sniffImageType(bytes(0xff, 0xd8, 0xff))?.mime).toBe('image/jpeg');
    expect(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))?.mime).toBe('image/png');
    expect(sniffImageType(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))?.mime).toBe('image/gif');
    const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    expect(sniffImageType(webp)?.ext).toBe('webp');
  });

  it('rejects SVG / HTML disguised as images', () => {
    expect(sniffImageType(new TextEncoder().encode('<svg onload="alert(1)">'))).toBeNull();
    expect(sniffImageType(new TextEncoder().encode('<html>'))).toBeNull();
  });
});

describe('ids and addresses', () => {
  it('validates UUIDs before they reach PostgREST filters', () => {
    expect(isUuid('3f2b8c1e-1a2b-4c3d-8e9f-0a1b2c3d4e5f')).toBe(true);
    expect(isUuid('x),user_id.eq.(y')).toBe(false);
  });

  it('whitelists address fields and checks coordinates', () => {
    const r = sanitizeAddressFields({ street: ' MG Road ', city: 'Pune', zip_code: '411001', evil: 'x' }, ['street', 'city', 'zip_code']);
    expect('address' in r && r.address).toEqual({ street: 'MG Road', city: 'Pune', zip_code: '411001' });
    expect(sanitizeDeliveryAddress({ street: 'A', coordinates: { lat: 'x', lng: 1 } })).toBeNull();
    expect(sanitizeDeliveryAddress({ city: 'Pune' })).toBeNull();
    expect(sanitizeDeliveryAddress(null)).toBeNull();
  });
});

describe('meal validation', () => {
  it('rejects zero price, bad enums and wrong types on edit', () => {
    expect(validateMealInput({ price: 0 }, true)).toEqual({ error: expect.any(String) });
    expect(validateMealInput({ price: null }, true)).toEqual({ error: expect.any(String) });
    expect(validateMealInput({ meal_type: 'brunch' }, true)).toEqual({ error: expect.any(String) });
    expect(validateMealInput({ is_veg: 'no' }, true)).toEqual({ error: expect.any(String) });
    expect(validateMealInput({ stock: 2.5 }, true)).toEqual({ error: expect.any(String) });
  });

  it('accepts a valid create payload and drops unknown fields', () => {
    const r = validateMealInput(
      { name: 'Thali', category: 'Main', meal_type: 'lunch', price: 120, preparation_time: 30, is_veg: true, rating: 5 },
      false
    );
    expect('values' in r && r.values).toEqual({
      name: 'Thali', category: 'Main', meal_type: 'lunch', price: 120, preparation_time: 30, is_veg: true,
    });
  });

  it('discount must be lower than price', () => {
    expect(checkDiscount(100, 120)).not.toBeNull();
    expect(checkDiscount(100, 80)).toBeNull();
    expect(checkDiscount(100, null)).toBeNull();
  });
});

describe('payments', () => {
  it('a failed payment can be retried', () => {
    expect(isPayableStatus('pending')).toBe(true);
    expect(isPayableStatus('failed')).toBe(true);
    expect(isPayableStatus('paid')).toBe(false);
    expect(isPayableStatus('refunded')).toBe(false);
  });
});
