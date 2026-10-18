/**
 * @jest-environment node
 */
import { checkDateChangeable, cutoffFor, lastDeliveryDate, nextExtensionDate } from '@/lib/subscriptions/manage';

jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn(), createClient: jest.fn() }));

const sub = {
  id: 's1',
  customer_id: 'c1',
  status: 'active',
  meal_type: 'lunch',
  delivery_time: '12:30 PM',
  delivery_days: ['monday', 'wednesday', 'friday'],
  start_date: '2026-10-19',
  end_date: '2026-10-25',
  paused_at: null,
  updated_at: '2026-10-18T00:00:00Z',
  deliveries: [],
  vendors: null,
} as any;

describe('subscription change rules', () => {
  it('lunch cutoff is 08:00 IST, dinner 15:00 IST', () => {
    expect(cutoffFor({ meal_type: 'lunch', delivery_time: '12:30 PM' }).hour).toBe(8);
    expect(cutoffFor({ meal_type: 'dinner', delivery_time: '08:00 PM' }).hour).toBe(15);
  });

  it('blocks past dates and same-day changes after the cutoff', () => {
    const at0730 = new Date('2026-10-19T02:00:00Z'); // 07:30 IST Monday
    const at0900 = new Date('2026-10-19T03:30:00Z'); // 09:00 IST Monday
    expect(checkDateChangeable(sub, '2026-10-18', at0730)).not.toBeNull();
    expect(checkDateChangeable(sub, '2026-10-19', at0730)).toBeNull();
    expect(checkDateChangeable(sub, '2026-10-19', at0900)).not.toBeNull();
    expect(checkDateChangeable(sub, '2026-10-20', at0900)).toBeNull();
    expect(checkDateChangeable(sub, 'not-a-date', at0900)).not.toBeNull();
  });

  it('extension is the next selected weekday after the last delivery', () => {
    const deliveries = [
      { date: '2026-10-19', status: 'skipped' },
      { date: '2026-10-21', status: 'scheduled' },
      { date: '2026-10-23', status: 'scheduled' },
    ];
    // After Fri 23 Oct (and end 25 Oct): next Mon/Wed/Fri is Mon 26 Oct.
    expect(nextExtensionDate(sub, deliveries)).toBe('2026-10-26');
    const withExt = [...deliveries, { date: '2026-10-26', status: 'scheduled', is_extended: true }];
    expect(nextExtensionDate(sub, withExt)).toBe('2026-10-28');
  });

  it('last delivery date falls back when empty', () => {
    expect(lastDeliveryDate([], '2026-10-25')).toBe('2026-10-25');
    expect(lastDeliveryDate([{ date: '2026-10-21', status: 'scheduled' }, { date: '2026-10-28', status: 'scheduled' }], 'x')).toBe('2026-10-28');
  });
});
