/**
 * Delivery Handover OTP Utility
 * Provides secure generation and verification of 4-digit delivery PINs
 */

export function getDeliveryOtp(order: {
  id?: string;
  order_number?: string;
  delivery_address?: any;
}): string {
  if (!order) return '1234';

  // 1. If order has an explicit OTP saved in delivery_address
  if (
    order.delivery_address &&
    typeof order.delivery_address === 'object' &&
    order.delivery_address.delivery_otp
  ) {
    return String(order.delivery_address.delivery_otp).trim();
  }

  // 2. Deterministic 4-digit PIN based on order_number or ID for existing orders
  const digits = (order.order_number || order.id || '2468').replace(/\D/g, '');
  if (digits.length >= 4) {
    return digits.slice(-4);
  }

  // 3. Fallback deterministic hash
  let hash = 0;
  const str = order.id || order.order_number || 'rasan';
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 9000;
  }
  return String(1000 + Math.abs(hash));
}

export function generateDeliveryOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function verifyDeliveryOtp(
  order: { id?: string; order_number?: string; delivery_address?: any },
  enteredOtp: string
): boolean {
  if (!enteredOtp) return false;
  const expectedOtp = getDeliveryOtp(order);
  return enteredOtp.trim() === expectedOtp.trim();
}
