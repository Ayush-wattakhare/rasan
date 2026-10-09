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
export async function reverseGeocode(lat: number, lng: number): Promise<LocationDetails> {
  let details: LocationDetails = {
    locality: 'Pimpri',
    full_address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
  };

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { 'User-Agent': 'Rasan-Food-Delivery-App' } }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      const road = addr.road || addr.street || addr.pedestrian || addr.path || '';
      const house = addr.house_number || addr.building || '';
      const street = [house, road].filter(Boolean).join(' ') || addr.suburb || addr.neighbourhood || '';

      const city = addr.city || addr.town || addr.village || addr.city_district || addr.county || 'Pune';
      const state = addr.state || addr.region || 'Maharashtra';
      const zip_code = addr.postcode || addr.postal_code || '';
      
      // Best locality determination (e.g., Pimpri, Rahatani, Wakad, Chinchwad)
      const locality = addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || addr.city_district || addr.town || city || 'Pimpri';

      details = {
        street,
        city,
        state,
        zip_code,
        locality,
        full_address: data.display_name || `${locality}, ${city}, ${state}`,
      };
    }
  } catch (e) {
    console.warn('Reverse geocoding failed, returning fallback coordinates:', e);
  }

  return details;
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
export async function getAccurateLocation(): Promise<AccurateLocationResult> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    throw new Error('Geolocation is not supported by your browser or device.');
  }

  const getPosition = (highAccuracy: boolean): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: highAccuracy,
          timeout: highAccuracy ? 10000 : 15000,
          maximumAge: 5000,
        }
      );
    });
  };

  let position: GeolocationPosition;
  try {
    // Try high accuracy mode first
    position = await getPosition(true);
  } catch (err: any) {
    // Fallback to standard accuracy if high accuracy timed out
    if (err.code === GeolocationPositionError.TIMEOUT) {
      console.warn('High accuracy GPS timed out, falling back to standard accuracy.');
      position = await getPosition(false);
    } else {
      throw err;
    }
  }

  const { latitude: lat, longitude: lng, accuracy } = position.coords;
  const details = await reverseGeocode(lat, lng);

  const result: AccurateLocationResult = { lat, lng, accuracy, details };
  setStoredDeliveryLocation(result);
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
      let msg = 'Failed to detect location.';
      if (err.code === 1) msg = 'Location permission denied. Please allow GPS access.';
      else if (err.code === 2) msg = 'GPS signal unavailable. Please try moving to an open area.';
      else if (err.code === 3) msg = 'Location request timed out. Retrying...';
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

