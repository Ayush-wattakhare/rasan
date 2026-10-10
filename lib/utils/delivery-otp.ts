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

/**
 * Returns the order without the handover PIN. Use before sending orders to
 * anyone other than the customer (riders, kitchens).
 */
export function withoutDeliveryOtp<T extends { delivery_address?: any }>(order: T): T {
  const address = order?.delivery_address;
  if (!address || typeof address !== 'object') return order;
  const { delivery_otp: _otp, ...rest } = address;
  return { ...order, delivery_address: rest };
}
