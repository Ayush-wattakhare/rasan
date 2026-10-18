import { haversineDistanceKm, MAX_DELIVERY_RADIUS_KM } from '@/lib/utils/constants';
import { parseVendorLocation } from '@/lib/utils/geo';

export type DeliveryRange =
  | { status: 'unknown' } // no customer location yet, or kitchen never pinned
  | { status: 'in-range'; distanceKm: number }
  | { status: 'out-of-range'; distanceKm: number };

/**
 * Whether a kitchen delivers to the customer. Same 10 km rule the order API
 * enforces at checkout. Pure: usable on the server and in the browser.
 */
export function deliveryRange(
  customer: { lat: number; lng: number } | null | undefined,
  vendorLocation: unknown
): DeliveryRange {
  const kitchen = parseVendorLocation(vendorLocation);
  if (!customer || !kitchen || !Number.isFinite(customer.lat) || !Number.isFinite(customer.lng)) {
    return { status: 'unknown' };
  }
  const distanceKm = haversineDistanceKm(customer.lat, customer.lng, kitchen.lat, kitchen.lng);
  return distanceKm <= MAX_DELIVERY_RADIUS_KM
    ? { status: 'in-range', distanceKm }
    : { status: 'out-of-range', distanceKm };
}
