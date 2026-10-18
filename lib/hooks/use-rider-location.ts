'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseRiderLocationOptions {
  deliveryPartnerId?: string;
  isOnline: boolean;
  minIntervalMs?: number; // Throttle sync (default: 12000 ms / 12s)
  minDistanceMeters?: number; // Distance threshold before immediate sync (default: 20m)
}

export interface RiderLocationState {
  isTracking: boolean;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  lastSyncedAt: Date | null;
  error: string | null;
  syncLocationNow: () => Promise<void>;
}

/**
 * Calculates distance between two coordinates in meters using the Haversine formula
 */
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function useRiderLocationTracker({
  deliveryPartnerId,
  isOnline,
  minIntervalMs = 12000,
  minDistanceMeters = 20,
}: UseRiderLocationOptions): RiderLocationState {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lastCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastSyncTimeRef = useRef<number>(0);
  const isSyncingRef = useRef(false);

  const sendLocationUpdate = useCallback(
    async (lat: number, lng: number) => {
      if (!deliveryPartnerId || isSyncingRef.current) return;

      isSyncingRef.current = true;
      try {
        const response = await fetch('/api/delivery/update-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deliveryPartnerId,
            latitude: lat,
            longitude: lng,
          }),
        });

        if (response.ok) {
          lastSyncTimeRef.current = Date.now();
          lastCoordsRef.current = { lat, lng };
          setLastSyncedAt(new Date());
          setError(null);
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn('GPS location sync server note:', errData.error || response.statusText);
        }
      } catch (err: any) {
        console.warn('GPS location sync network note:', err.message);
      } finally {
        isSyncingRef.current = false;
      }
    },
    [deliveryPartnerId]
  );

  const handlePositionUpdate = useCallback(
    (position: GeolocationPosition) => {
      const { latitude: lat, longitude: lng, accuracy: acc } = position.coords;
      setLatitude(lat);
      setLongitude(lng);
      setAccuracy(Math.round(acc));
      setError(null);

      const now = Date.now();
      const timeSinceLastSync = now - lastSyncTimeRef.current;

      let shouldSync = false;

      if (!lastCoordsRef.current) {
        // First sync
        shouldSync = true;
      } else {
        const distanceMoved = calculateDistanceMeters(
          lastCoordsRef.current.lat,
          lastCoordsRef.current.lng,
          lat,
          lng
        );

        if (distanceMoved >= minDistanceMeters && timeSinceLastSync >= 6000) {
          shouldSync = true;
        } else if (timeSinceLastSync >= minIntervalMs) {
          shouldSync = true;
        }
      }

      if (shouldSync && isOnline) {
        sendLocationUpdate(lat, lng);
      }
    },
    [isOnline, minDistanceMeters, minIntervalMs, sendLocationUpdate]
  );

  const syncLocationNow = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    // An offline rider's position is never broadcast.
    if (!isOnline) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // handlePositionUpdate applies the throttle; a manual sync always sends once.
        handlePositionUpdate(pos);
        if (!isSyncingRef.current) sendLocationUpdate(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setError(err.message || 'Unable to retrieve location');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  }, [handlePositionUpdate, sendLocationUpdate, isOnline]);

  useEffect(() => {
    if (
      !isOnline ||
      !deliveryPartnerId ||
      typeof window === 'undefined' ||
      !navigator.geolocation
    ) {
      setIsTracking(false);
      return;
    }

    setIsTracking(true);

    const watchId = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      (err) => {
        console.warn('Rider geolocation watch error:', err.message);
        setError(err.message || 'Location permission denied or unavailable');
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setIsTracking(false);
    };
  }, [isOnline, deliveryPartnerId, handlePositionUpdate]);

  return {
    isTracking,
    latitude,
    longitude,
    accuracy,
    lastSyncedAt,
    error,
    syncLocationNow,
  };
}
