import type { SupabaseClient } from '@supabase/supabase-js';
import { MAX_DELIVERY_RADIUS_KM } from '@/lib/utils/constants';
import type { DeliveryLocation } from './location-cookie';

/**
 * Kitchens that can deliver to a location (nearby_kitchens(), migration 007).
 * Used by every listing (home, /meals, /vendors, header search) so they all
 * agree on what "near you" means: active, really pinned, within the delivery radius.
 */

export interface NearbyKitchen {
  id: string;
  business_name: string;
  description: string | null;
  cuisine: string[] | null;
  address: string | null;
  rating: number | null;
  total_orders: number | null;
  operating_hours: unknown;
  distance_km: number;
}

export type ServiceArea =
  | { status: 'no-location' }
  | { status: 'unavailable'; location: DeliveryLocation; reason: 'none-in-range' | 'lookup-failed' }
  | { status: 'available'; location: DeliveryLocation; kitchens: NearbyKitchen[] };

/** Read-only preview areas for customers outside the delivery zone ("Browse Pune menus"). */
export const PREVIEW_AREAS = {
  pune: { lat: 18.5204, lng: 73.8567, radiusKm: 35, label: 'Pune & PCMC' },
} as const;
export type PreviewAreaKey = keyof typeof PREVIEW_AREAS;

export function isPreviewArea(value: unknown): value is PreviewAreaKey {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(PREVIEW_AREAS, value);
}

export async function getNearbyKitchens(
  supabase: SupabaseClient<any>,
  lat: number,
  lng: number,
  radiusKm: number = MAX_DELIVERY_RADIUS_KM
): Promise<NearbyKitchen[] | null> {
  const { data, error } = await supabase.rpc('nearby_kitchens', {
    user_lat: lat,
    user_lng: lng,
    radius_km: radiusKm,
  });
  if (error) {
    // e.g. migration 007 not applied yet. Callers show the empty state; never
    // fall back to an unfiltered list.
    console.error('[nearby] nearby_kitchens failed:', error.message);
    return null;
  }
  return ((data as any[]) || []).map((k) => ({
    ...k,
    rating: k.rating == null ? null : Number(k.rating),
    total_orders: k.total_orders == null ? null : Number(k.total_orders),
    distance_km: Number(k.distance_km),
  }));
}

/** Resolves what a customer at `location` can order from. */
export async function getServiceArea(
  supabase: SupabaseClient<any>,
  location: DeliveryLocation | null
): Promise<ServiceArea> {
  if (!location) return { status: 'no-location' };
  const kitchens = await getNearbyKitchens(supabase, location.lat, location.lng);
  if (kitchens === null) return { status: 'unavailable', location, reason: 'lookup-failed' };
  if (kitchens.length === 0) return { status: 'unavailable', location, reason: 'none-in-range' };
  return { status: 'available', location, kitchens };
}

/** Delivered-order counts per meal over the last 30 days (meal_order_counts(), migration 007). */
export async function getMealOrderCounts(
  supabase: SupabaseClient<any>,
  mealIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (mealIds.length === 0) return counts;
  const { data, error } = await supabase.rpc('meal_order_counts', { meal_ids: mealIds.slice(0, 500), days: 30 });
  if (error) {
    console.error('[nearby] meal_order_counts failed:', error.message);
    return counts;
  }
  for (const row of (data as any[]) || []) counts.set(row.meal_id, Number(row.order_count) || 0);
  return counts;
}

export function formatDistance(km: number): string {
  if (!Number.isFinite(km)) return '';
  return km < 1 ? `${Math.max(100, Math.round((km * 1000) / 100) * 100)} m away` : `${km.toFixed(1)} km away`;
}
