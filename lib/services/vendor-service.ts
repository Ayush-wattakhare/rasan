/**
 * Vendor Service
 * Handles vendor-related operations including geospatial queries
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_VENDOR_COLUMNS } from '@/lib/supabase/public-columns';
import type { Database } from '@/types/database.types';
import { sanitizeSearch } from '@/lib/utils/search';
import { addDaysISO, istTimeHHMM, istToday, weekdayOf } from '@/lib/utils/ist-date';

type SupabaseClientType = SupabaseClient<Database>;

export interface VendorFilters {
  cuisineType?: string;
  search?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

/**
 * Get vendors with filters and optional location-based sorting
 */
export async function getVendors(
  supabase: SupabaseClientType,
  filters: VendorFilters = {},
  page: number = 1,
  limit: number = 12
) {
  let query = supabase
    .from('vendors')
    .select(PUBLIC_VENDOR_COLUMNS, { count: 'exact' })
    .eq('is_active', true);

  // Apply cuisine filter (the column is `cuisine`, a text[])
  if (filters.cuisineType) {
    query = query.contains('cuisine', [String(filters.cuisineType).slice(0, 40)]);
  }

  // Apply search filter (the name column is `business_name`)
  const search = sanitizeSearch(filters.search);
  if (search) {
    query = query.or(`business_name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  page = Math.max(1, Math.floor(page) || 1);

  // Default sorting by rating
  query = query.order('rating', { ascending: false, nullsFirst: false });

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching vendors:', error);
    return { vendors: [], total: 0, page, limit };
  }

  return {
    vendors: data || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

/**
 * Get nearby vendors using PostGIS
 */
export async function getNearbyVendors(
  supabase: SupabaseClientType,
  latitude: number,
  longitude: number,
  radiusKm: number = 10
) {
  const { data, error } = await supabase.rpc('nearby_vendors', {
    lat: latitude,
    lng: longitude,
    radius_km: radiusKm,
  });

  if (error) {
    console.error('Error fetching nearby vendors:', error);
    return [];
  }

  return data || [];
}

/**
 * Get vendor by ID with full details
 */
export async function getVendorById(
  supabase: SupabaseClientType,
  vendorId: string
) {
  const { data, error } = await supabase
    .from('vendors')
    .select(PUBLIC_VENDOR_COLUMNS)
    .eq('id', vendorId)
    .single();

  if (error) {
    console.error('Error fetching vendor:', error);
    return null;
  }

  return data;
}

/**
 * Get vendor's meals
 */
export async function getVendorMeals(
  supabase: SupabaseClientType,
  vendorId: string
) {
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('is_available', true)
    .order('name');

  if (error) {
    console.error('Error fetching vendor meals:', error);
    return [];
  }

  return (data || []).map((meal: any) => ({
    ...meal,
    price: Math.round(Number(meal.price) || 0),
    discount_price: meal.discount_price ? Math.round(Number(meal.discount_price)) : null,
  }));
}

/**
 * Check if vendor is currently open
 */
export function isVendorOpen(operatingHours: any, now: Date = new Date()): boolean {
  if (!operatingHours) return false;

  // Kitchens run on India time, whatever timezone the server is in.
  const today = istToday(now);
  const currentDay = weekdayOf(today);
  const yesterday = weekdayOf(addDaysISO(today, -1));
  const currentTime = istTimeHHMM(now);

  const isValid = (s: any) =>
    s && s.is_open && typeof s.open_time === 'string' && typeof s.close_time === 'string';

  const todaySchedule = operatingHours[currentDay];
  if (isValid(todaySchedule)) {
    const { open_time: open, close_time: close } = todaySchedule;
    if (open <= close) {
      if (currentTime >= open && currentTime <= close) return true;
    } else if (currentTime >= open) {
      // Overnight hours (e.g. 18:00-02:00): open from `open` until midnight.
      return true;
    }
  }

  // After midnight, still inside yesterday's overnight window.
  const prev = operatingHours[yesterday];
  if (isValid(prev) && prev.open_time > prev.close_time && currentTime <= prev.close_time) {
    return true;
  }

  return false;
}

/**
 * Get unique cuisine types from all vendors
 */
export async function getCuisineTypes(supabase: SupabaseClientType) {
  const { data, error } = await supabase
    .from('vendors')
    .select('cuisine')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching cuisine types:', error);
    return [];
  }

  // Extract unique cuisine types
  const cuisineSet = new Set<string>();
  data?.forEach((vendor) => {
    vendor.cuisine?.forEach((cuisine: string) => cuisineSet.add(cuisine));
  });

  return Array.from(cuisineSet).sort();
}
