/**
 * Calendar-date helpers for India (Asia/Kolkata).
 *
 * Dates are plain 'YYYY-MM-DD' strings. All arithmetic is done in UTC on those
 * strings, so the result never depends on the server's or browser's timezone.
 */

export const IST_TIMEZONE = 'Asia/Kolkata';
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const WEEKDAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;
export type WeekdayName = (typeof WEEKDAY_NAMES)[number];

export function isISODate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Today's date in IST, e.g. '2026-10-18'. */
export function istToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Current hour (0-23) in IST. */
export function istHour(now: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: IST_TIMEZONE, hour: '2-digit', hour12: false }).format(now)
  ) % 24;
}

/** Current time in IST as 'HH:MM'. */
export function istTimeHHMM(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now).replace(/^24/, '00');
}

export function addDaysISO(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from `a` to `b` (positive when b is later). */
export function daysBetweenISO(a: string, b: string): number {
  return Math.round(
    (new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86_400_000
  );
}

export function weekdayOf(date: string): WeekdayName {
  return WEEKDAY_NAMES[new Date(`${date}T00:00:00Z`).getUTCDay()];
}

/** Weekday name for 'now' in IST. */
export function istWeekday(now: Date = new Date()): WeekdayName {
  return weekdayOf(istToday(now));
}
