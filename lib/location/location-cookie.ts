/**
 * The customer's confirmed delivery location, shared between the browser
 * (written when they confirm a spot on the map) and the server (which uses it
 * to list only kitchens that can deliver there).
 *
 * Plain module (no 'use client' / 'server-only') so both sides use one format.
 */

export const LOCATION_COOKIE = 'rasan_loc';
/** 90 days. */
export const LOCATION_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

export interface DeliveryLocation {
  lat: number;
  lng: number;
  /** Display name, e.g. "Nagpur" or "Wakad". May be empty. */
  city: string;
}

export function serializeLocationCookie(loc: DeliveryLocation): string {
  return encodeURIComponent(
    JSON.stringify({
      lat: Math.round(loc.lat * 1e6) / 1e6,
      lng: Math.round(loc.lng * 1e6) / 1e6,
      city: String(loc.city || '').slice(0, 60),
    })
  );
}

/** Parses and validates the cookie value. Anything malformed counts as "no location". */
export function parseLocationCookie(raw: string | undefined | null): DeliveryLocation | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(decodeURIComponent(raw));
    const lat = Number(value?.lat);
    const lng = Number(value?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    if (lat === 0 && lng === 0) return null;
    const city = typeof value?.city === 'string' ? value.city.replace(/[<>]/g, '').trim().slice(0, 60) : '';
    return { lat, lng, city };
  } catch {
    return null;
  }
}
