/**
 * Delivery handover OTP (client-safe part).
 * Each order gets a random 4-digit PIN at creation, stored in
 * delivery_address.delivery_otp. There is no derived fallback: an order
 * without a stored PIN cannot be completed by OTP.
 * Generation and verification live in ./delivery-otp-server.ts.
 */
export function getDeliveryOtp(order: { delivery_address?: any } | null | undefined): string | null {
  const otp = order?.delivery_address?.delivery_otp;
  return otp ? String(otp).trim() : null;
}
