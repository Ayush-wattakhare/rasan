import { randomInt, timingSafeEqual } from 'crypto';
import { getDeliveryOtp } from './delivery-otp';

export function generateDeliveryOtp(): string {
  return randomInt(1000, 10000).toString();
}

export function verifyDeliveryOtp(
  order: { delivery_address?: any } | null | undefined,
  enteredOtp: string
): boolean {
  const expected = getDeliveryOtp(order);
  if (!expected || !enteredOtp) return false;
  const a = Buffer.from(String(enteredOtp).trim());
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
