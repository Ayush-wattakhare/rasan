// Server-only: imports next/headers (fails loudly if pulled into a client bundle).
import { cookies } from 'next/headers';
import { LOCATION_COOKIE, parseLocationCookie, type DeliveryLocation } from './location-cookie';

/** The delivery location the customer confirmed on the map, or null if none / invalid. */
export async function getDeliveryLocation(): Promise<DeliveryLocation | null> {
  const store = await cookies();
  return parseLocationCookie(store.get(LOCATION_COOKIE)?.value);
}
