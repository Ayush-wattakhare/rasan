/**
 * Delivery handover OTP (client-safe part).
 * Codes are stored in `order_handover_codes`, readable only by the ordering
 * customer. Customer queries embed it as `handover:order_handover_codes(code)`.
 * There is no derived fallback PIN.
 */
export const HANDOVER_EMBED = 'handover:order_handover_codes(code)';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDeliveryOtp(order: any): string | null {
  const handover = Array.isArray(order?.handover) ? order?.handover[0] : order?.handover;
  return handover?.code ? String(handover.code) : null;
}

/**
 * Returns the order without any handover code data. Use before sending orders
 * to anyone other than the customer (riders, kitchens).
 */
export function withoutDeliveryOtp<T extends { delivery_address?: any; handover?: any }>(order: T): T {
  const { handover: _handover, ...rest } = order as any;
  const address = rest.delivery_address;
  if (address && typeof address === 'object' && 'delivery_otp' in address) {
    const { delivery_otp: _otp, ...cleanAddress } = address;
    rest.delivery_address = cleanAddress;
  }
  return rest as T;
}
