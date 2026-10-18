/**
 * @jest-environment node
 */
import { isVendorOpen } from '@/lib/services/vendor-service';

const hours = {
  monday: { is_open: true, open_time: '09:00', close_time: '21:00' },
  tuesday: { is_open: true, open_time: '18:00', close_time: '02:00' }, // overnight
  wednesday: { is_open: false, open_time: '09:00', close_time: '21:00' },
};

describe('isVendorOpen (IST, overnight hours)', () => {
  it('uses India time regardless of server timezone', () => {
    // Mon 19 Oct 2026, 04:00 UTC = 09:30 IST -> open
    expect(isVendorOpen(hours, new Date('2026-10-19T04:00:00Z'))).toBe(true);
    // Mon 02:00 UTC = 07:30 IST -> closed
    expect(isVendorOpen(hours, new Date('2026-10-19T02:00:00Z'))).toBe(false);
  });

  it('handles hours that run past midnight', () => {
    // Tue 20 Oct 23:00 IST = 17:30 UTC -> open (Tue 18:00-02:00)
    expect(isVendorOpen(hours, new Date('2026-10-20T17:30:00Z'))).toBe(true);
    // Wed 21 Oct 01:30 IST = Tue 20:00 UTC -> still inside Tuesday's window
    expect(isVendorOpen(hours, new Date('2026-10-20T20:00:00Z'))).toBe(true);
    // Wed 21 Oct 03:00 IST -> closed
    expect(isVendorOpen(hours, new Date('2026-10-20T21:30:00Z'))).toBe(false);
  });

  it('closed days and missing hours are closed', () => {
    expect(isVendorOpen(hours, new Date('2026-10-21T06:00:00Z'))).toBe(false);
    expect(isVendorOpen(null)).toBe(false);
  });
});
