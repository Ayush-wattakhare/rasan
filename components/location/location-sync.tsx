'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  RASAN_LOCATION_EVENT,
  getStoredDeliveryLocation,
  hasLocationCookie,
  writeLocationCookie,
} from '@/lib/hooks/use-location';

/**
 * Keeps server-rendered listings in step with the customer's chosen location:
 * - when a location is confirmed, re-renders the page so "near you" sections
 *   reflect it straight away;
 * - for visitors who picked a location before the cookie existed, copies it
 *   from localStorage into the cookie once.
 */
export function LocationSync() {
  const router = useRouter();

  useEffect(() => {
    if (!hasLocationCookie()) {
      const stored = getStoredDeliveryLocation();
      if (stored && Number.isFinite(stored.lat) && Number.isFinite(stored.lng)) {
        writeLocationCookie(stored);
        router.refresh();
      }
    }

    const onChange = () => router.refresh();
    window.addEventListener(RASAN_LOCATION_EVENT, onChange);
    return () => window.removeEventListener(RASAN_LOCATION_EVENT, onChange);
  }, [router]);

  return null;
}
