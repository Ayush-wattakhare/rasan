/**
 * Meal Service
 * Handles meal-related operations
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_VENDOR_COLUMNS } from '@/lib/supabase/public-columns';
import type { Database } from '@/types/database.types';
import type { MealType } from '@/types';
import { sanitizeSearch } from '@/lib/utils/search';
import { getMealOrderCounts } from '@/lib/location/nearby';

type SupabaseClientType = SupabaseClient<Database>;

export interface MealFilters {
  category?: string;
  mealType?: MealType;
  isVegetarian?: boolean;
  minPrice?: number;
  maxPrice?: number;
  vendorId?: string;
  search?: string;
  /** Matches the kitchen's cuisine list (vendors.cuisine). */
  cuisine?: string;
  /** Only meals from these kitchens (the ones that deliver to the customer). Empty = none. */
  vendorIds?: string[];
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'popularity';
}

/**
 * Get meals with filters and pagination
 */
export async function getMeals(
  supabase: SupabaseClientType,
  filters: MealFilters = {},
  page: number = 1,
  limit: number = 12
) {
  let query = supabase
    .from('meals')
    .select('*, vendors!inner(id, business_name, rating, is_active, cuisine)', { count: 'exact' })
    .eq('is_available', true)
    .eq('vendors.is_active', true)
    .not('vendors.business_name', 'ilike', '%test%');

  // Apply filters
  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  if (filters.mealType) {
    query = query.eq('meal_type', filters.mealType);
  }

  if (filters.isVegetarian !== undefined) {
    query = query.eq('is_veg', filters.isVegetarian);
  }

  if (filters.minPrice !== undefined) {
    query = query.gte('price', filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    query = query.lte('price', filters.maxPrice);
  }

  if (filters.vendorId) {
    query = query.eq('vendor_id', filters.vendorId);
  }

  if (filters.vendorIds) {
    if (filters.vendorIds.length === 0) {
      return { meals: [], total: 0, page, limit, totalPages: 0 };
    }
    query = query.in('vendor_id', filters.vendorIds.slice(0, 200));
  }

  if (filters.cuisine) {
    query = query.contains('vendors.cuisine', [filters.cuisine]);
  }

  const search = sanitizeSearch(filters.search);
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Apply sorting
  switch (filters.sortBy) {
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'rating':
      query = query.order('rating', { ascending: false, nullsFirst: false });
      break;
    case 'popularity':
      // meals has no order counter: rank by real delivered orders below.
      query = query.order('created_at', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  page = Math.max(1, Math.floor(page) || 1);

  if (filters.sortBy === 'popularity') {
    // Rank in memory by delivered orders over the last 30 days, then paginate.
    // Bounded: listings are already limited to nearby kitchens.
    const { data, error } = await query.limit(500);
    if (error) return { meals: [], total: 0, page, limit, totalPages: 0 };
    const rows = data || [];
    const counts = await getMealOrderCounts(supabase as any, rows.map((m: any) => m.id));
    const ranked = rows
      .map((m: any) => ({ ...m, order_count: counts.get(m.id) || 0 }))
      .sort((a: any, b: any) => b.order_count - a.order_count);
    const start = (page - 1) * limit;
    return {
      meals: ranked.slice(start, start + limit).map((meal: any) => ({
        ...meal,
        price: Math.round(Number(meal.price) || 0),
        discount_price: meal.discount_price ? Math.round(Number(meal.discount_price)) : null,
      })),
      total: ranked.length,
      page,
      limit,
      totalPages: Math.ceil(ranked.length / limit),
    };
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    // Supabase PostgrestError has non-enumerable properties — spread gives {}
    // Access them directly for correct logging
    const code = String(error.code ?? '');
    const message = String(error.message ?? '');
    const details = String(error.details ?? '');
    const hint = String(error.hint ?? '');

    // Silently return empty for known "table not ready" states (db not seeded yet)
    // and for network errors (Supabase unreachable / ENOTFOUND)
    const isTableError =
      code === 'PGRST116' ||
      code === '42P01' ||
      message.includes('relation') ||
      message.includes('table') ||
      message.includes('does not exist') ||
      message.includes('fetch failed') ||
      message.includes('ENOTFOUND') ||
      message.includes('schema cache');

    if (isTableError) {
      return { meals: [], total: 0, page, limit, totalPages: 0 };
    }

    if (process.env.NODE_ENV === 'development') {
      console.error(`[meal-service] getMeals error — code: ${code}, message: ${message}, details: ${details}, hint: ${hint}`);
    }

    return { meals: [], total: 0, page, limit, totalPages: 0 };
  }

  return {
    meals: (data || []).map((meal: any) => ({
      ...meal,
      price: Math.round(Number(meal.price) || 0),
      discount_price: meal.discount_price ? Math.round(Number(meal.discount_price)) : null,
    })),
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

/**
 * Get meal by ID with full details
 */
export async function getMealById(
  supabase: SupabaseClientType,
  mealId: string
) {
  const { data, error } = await supabase
    .from('meals')
    .select(`*, vendors(${PUBLIC_VENDOR_COLUMNS})`)
    .eq('id', mealId)
    .single();

  if (error) {
    const code = String(error.code ?? '');
    const message = String(error.message ?? error);
    
    const isSilent = 
      code === 'PGRST116' ||
      code === '42P01' ||
      message.includes('fetch failed') || 
      message.includes('ENOTFOUND') || 
      message.includes('relation') || 
      message.includes('does not exist') ||
      message.includes('schema cache');

    if (!isSilent && process.env.NODE_ENV === 'development') {
      console.error(`[meal-service] getMealById error — code: ${code}, message: ${message}`);
    }
    return null;
  }

  if (data) {
    data.price = Math.round(Number(data.price) || 0);
    if (data.discount_price) {
      data.discount_price = Math.round(Number(data.discount_price));
    }
  }

  return data;
}

/**
 * Get meal categories
 */
export async function getMealCategories(supabase: SupabaseClientType) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    const code = String(error.code ?? '');
    const message = String(error.message ?? '');
    // Silently skip network errors and missing table errors
    const isSilent = 
      code === 'PGRST116' ||
      code === '42P01' ||
      message.includes('fetch failed') || 
      message.includes('ENOTFOUND') || 
      message.includes('relation') || 
      message.includes('does not exist') ||
      message.includes('schema cache');
      
    if (!isSilent && process.env.NODE_ENV === 'development') {
      console.error(`[meal-service] getMealCategories error — code: ${code}, message: ${message}`);
    }
    return [];
  }

  return data || [];
}
