'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  LOCATION_COOKIE,
  LOCATION_COOKIE_MAX_AGE,
  serializeLocationCookie,
} from '@/lib/location/location-cookie';

export interface LocationDetails {
  street?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  locality?: string;
  full_address?: string;
  building?: string;
  landmark?: string;
}

export interface AccurateLocationResult {
  lat: number;
  lng: number;
  accuracy: number;
  details: LocationDetails;
}

export const RASAN_LOCATION_STORAGE_KEY = 'rasan_delivery_location';
export const RASAN_LOCATION_EVENT = 'rasan_location_changed';

/**
 * Get stored delivery location from localStorage if present
 */
export function getStoredDeliveryLocation(): AccurateLocationResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(RASAN_LOCATION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Save selected delivery location and notify all listening components
 */
export function setStoredDeliveryLocation(location: AccurateLocationResult): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RASAN_LOCATION_STORAGE_KEY, JSON.stringify(location));
    writeLocationCookie(location);
    window.dispatchEvent(new CustomEvent(RASAN_LOCATION_EVENT, { detail: location }));
  } catch (err) {
    console.error('Failed to store delivery location:', err);
  }
}

/** Display name for a stored location (city first, then locality). */
export function locationCityName(location: Pick<AccurateLocationResult, 'details'> | null): string {
  const d = location?.details || {};
  return d.city || d.locality || '';
}

/**
 * Mirrors the location into a cookie so server-rendered pages (home, /meals,
 * /vendors) can list only kitchens that deliver there. localStorage stays the
 * source for the full address details.
 */
export function writeLocationCookie(location: Pick<AccurateLocationResult, 'lat' | 'lng' | 'details'>): void {
  if (typeof document === 'undefined') return;
  if (!Number.isFinite(location.lat) || !Number.isFinite(location.lng)) return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${LOCATION_COOKIE}=${serializeLocationCookie({ lat: location.lat, lng: location.lng, city: locationCityName(location) })}` +
    `; Path=/; Max-Age=${LOCATION_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

export function hasLocationCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith(`${LOCATION_COOKIE}=`));
}

/** True when a lookup produced a real place name rather than bare coordinates. */
export function hasResolvedAddress(details: LocationDetails | null | undefined): boolean {
  return Boolean(details?.locality || details?.city || details?.street);
}

/**
 * Reverse geocode latitude and longitude to address details via /api/geocode
 * (server proxy to OpenStreetMap Nominatim). On failure only the raw
 * coordinates are returned; use `hasResolvedAddress` to detect that.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<LocationDetails> {
  // Never invent a place: if lookup fails, show the raw coordinates only.
  const fallback: LocationDetails = {
    full_address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
  };

  try {
    const res = await fetch(`/api/geocode?lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}`, { signal });
    if (!res.ok) return fallback;
    const data = await res.json();
    const d = data?.details;
    if (!d || typeof d !== 'object') return fallback;
    return { ...d, full_address: d.full_address || fallback.full_address };
  } catch (e: any) {
    if (e?.name === 'AbortError') throw e;
    console.warn('Reverse geocoding failed, showing coordinates only:', e);
    return fallback;
  }
}

/** Converts a GeolocationPositionError (or anything) into a user-facing message. */
export function describeGeolocationError(err: any): string {
  switch (err?.code) {
    case 1:
      return 'Location permission is blocked. Allow location access for this site in your browser settings, then try again.';
    case 2:
      return 'Your device could not determine its position. Turn on GPS / Location services and try again.';
    case 3:
      return 'Getting your location took too long. Move near a window or open area and try again.';
    default:
      return err?.message || 'Could not detect your current location.';
  }
}

/**
 * Watches the device position for a short window and resolves with the most
 * accurate fix. The first fix a browser returns is often a coarse Wi-Fi/IP
 * estimate (hundreds of metres to kilometres off); waiting a few seconds lets
 * GPS lock on. Resolves early once accuracy is within `targetAccuracy` metres.
 */
export function getBestPosition(options?: {
  targetAccuracy?: number;
  maxWaitMs?: number;
  onProgress?: (pos: GeolocationPosition) => void;
}): Promise<GeolocationPosition> {
  const targetAccuracy = options?.targetAccuracy ?? 30;
  const maxWaitMs = options?.maxWaitMs ?? 12000;

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by your browser or device.'));
      return;
    }
    if (!window.isSecureContext) {
      reject(new Error('Live location needs a secure (https) connection.'));
      return;
    }

    let best: GeolocationPosition | null = null;
    let settled = false;

    const finish = (result?: GeolocationPosition, error?: unknown) => {
      if (settled) return;
      settled = true;
      navigator.geolocation.clearWatch(watchId);
      clearTimeout(timer);
      if (result) resolve(result);
      else reject(error);
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!best || pos.coords.accuracy < best.coords.accuracy) {
          best = pos;
          options?.onProgress?.(pos);
        }
        if (pos.coords.accuracy <= targetAccuracy) finish(pos);
      },
      (err) => {
        // Keep waiting on transient errors if we already have a fix.
        if (err.code === 1 || !best) finish(undefined, err);
      },
      { enableHighAccuracy: true, timeout: maxWaitMs, maximumAge: 0 }
    );

    const timer = setTimeout(() => {
      if (best) finish(best);
      else finish(undefined, { code: 3, message: 'Location request timed out.' });
    }, maxWaitMs);
  });
}

export interface LocationSearchResult {
  display_name: string;
  lat: number;
  lng: number;
  locality: string;
  city?: string;
}

/**
 * Search places in India via /api/geocode. When `near` is given, results
 * close to that point rank first (e.g. typing "Sitabuldi" while pinned in Nagpur).
 */
export async function searchLocations(
  query: string,
  near?: { lat: number; lng: number } | null,
  signal?: AbortSignal
): Promise<LocationSearchResult[]> {
  const q = query?.trim() || '';
  if (q.length < 2) return [];

  const params = new URLSearchParams({ q });
  if (near && Number.isFinite(near.lat) && Number.isFinite(near.lng)) {
    params.set('lat', near.lat.toFixed(4));
    params.set('lng', near.lng.toFixed(4));
  }

  try {
    const res = await fetch(`/api/geocode?${params.toString()}`, { signal });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.results) ? data.results : [];
  } catch (e: any) {
    if (e?.name === 'AbortError') throw e;
    console.warn('Location search failed:', e);
    return [];
  }
}

/**
 * Perform high-accuracy geolocation lookup with automatic retry and reverse geocoding
 */
export async function getAccurateLocation(options?: {
  /** Save as the app-wide delivery location (default true). */
  persist?: boolean;
  onProgress?: (pos: GeolocationPosition) => void;
}): Promise<AccurateLocationResult> {
  let position: GeolocationPosition;
  try {
    position = await getBestPosition({ onProgress: options?.onProgress });
  } catch (err) {
    throw new Error(describeGeolocationError(err));
  }

  const { latitude: lat, longitude: lng, accuracy } = position.coords;
  const details = await reverseGeocode(lat, lng);

  const result: AccurateLocationResult = { lat, lng, accuracy, details };
  if (options?.persist !== false) setStoredDeliveryLocation(result);
  return result;
}

export function useLocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<AccurateLocationResult | null>(null);

  // Initialize from storage or live event
  useEffect(() => {
    const stored = getStoredDeliveryLocation();
    if (stored) {
      setLocation(stored);
    }

    const handleLocationChange = (e: CustomEvent<AccurateLocationResult>) => {
      if (e.detail) {
        setLocation(e.detail);
      }
    };

    window.addEventListener(RASAN_LOCATION_EVENT as any, handleLocationChange as any);
    return () => {
      window.removeEventListener(RASAN_LOCATION_EVENT as any, handleLocationChange as any);
    };
  }, []);

  const detectLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAccurateLocation();
      setLocation(result);
      return result;
    } catch (err: any) {
      const msg = err?.message || 'Failed to detect location.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const setManualLocation = useCallback((newLoc: AccurateLocationResult) => {
    setLocation(newLoc);
    setStoredDeliveryLocation(newLoc);
  }, []);

  return {
    loading,
    error,
    location,
    detectLocation,
    setManualLocation,
  };
}

