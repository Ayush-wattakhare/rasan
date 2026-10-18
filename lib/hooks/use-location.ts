'use client';

import { useState, useCallback, useEffect } from 'react';

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
    window.dispatchEvent(new CustomEvent(RASAN_LOCATION_EVENT, { detail: location }));
  } catch (err) {
    console.error('Failed to store delivery location:', err);
  }
}

/**
 * Reverse geocode latitude and longitude to address details using OpenStreetMap Nominatim
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<LocationDetails> {
  // Never invent a place: if lookup fails, show the raw coordinates only.
  let details: LocationDetails = {
    full_address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
  };

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18&accept-language=en`,
      { signal }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      const road = addr.road || addr.street || addr.pedestrian || addr.path || '';
      const house = addr.house_number || '';
      const street = [house, road].filter(Boolean).join(' ') || addr.suburb || addr.neighbourhood || '';

      const city = addr.city || addr.town || addr.village || addr.city_district || addr.county || '';
      const state = addr.state || addr.region || '';
      const zip_code = addr.postcode || '';
      const locality =
        addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || addr.city_district || addr.town || city || '';

      details = {
        street,
        city,
        state,
        zip_code,
        locality,
        building: addr.building || addr.amenity || '',
        full_address: data.display_name || details.full_address,
      };
    }
  } catch (e: any) {
    if (e?.name === 'AbortError') throw e;
    console.warn('Reverse geocoding failed, showing coordinates only:', e);
  }

  return details;
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

/**
 * Search locations by query string using Nominatim API
 */
export async function searchLocations(query: string): Promise<Array<{
  display_name: string;
  lat: number;
  lng: number;
  locality: string;
}>> {
  if (!query || query.trim().length < 2) return [];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&addressdetails=1&countrycodes=in&limit=6`,
      { headers: { 'User-Agent': 'Rasan-Food-Delivery-App' } }
    );
    if (!res.ok) return [];
    const data = await res.json();

    return data.map((item: any) => {
      const addr = item.address || {};
      const locality = addr.suburb || addr.neighbourhood || addr.quarter || addr.city_district || addr.town || addr.city || item.name || 'Location';
      return {
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        locality,
      };
    });
  } catch (e) {
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

