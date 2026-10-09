/**
 * Vendor Service
 * Handles vendor-related operations including geospatial queries
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

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
    .select('*', { count: 'exact' })
    .eq('is_active', true);

  // Apply cuisine filter
  if (filters.cuisineType) {
    query = query.contains('cuisine_types', [filters.cuisineType]);
  }

  // Apply search filter
  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

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
    .select('*')
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

  return data || [];
}

/**
 * Check if vendor is currently open
 */
export function isVendorOpen(operatingHours: any): boolean {
  if (!operatingHours) return false;

  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[now.getDay()];
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  const daySchedule = operatingHours[currentDay];
  if (!daySchedule || !daySchedule.is_open) return false;

  return currentTime >= daySchedule.open_time && currentTime <= daySchedule.close_time;
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
