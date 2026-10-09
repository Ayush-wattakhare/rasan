/**
 * Helper types and utility functions for Supabase operations
 */

import type { Database } from '@/types/database.types';

// Table type helpers
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Enum type helpers
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

// Function type helpers
export type Functions<T extends keyof Database['public']['Functions']> =
  Database['public']['Functions'][T];

// Specific table types for convenience
export type Profile = Tables<'profiles'>;
export type Vendor = Tables<'vendors'>;
export type Meal = Tables<'meals'>;
export type Order = Tables<'orders'>;
export type DeliveryPartner = Tables<'delivery_partners'>;
export type Subscription = Tables<'subscriptions'>;
export type Notification = Tables<'notifications'>;
export type Category = Tables<'categories'>;
export type Review = Tables<'reviews'>;
export type GroupOrder = Tables<'group_orders'>;
export type PlanPricing = Tables<'plan_pricing'>;

// Insert types
export type ProfileInsert = TablesInsert<'profiles'>;
export type VendorInsert = TablesInsert<'vendors'>;
export type MealInsert = TablesInsert<'meals'>;
export type OrderInsert = TablesInsert<'orders'>;
export type DeliveryPartnerInsert = TablesInsert<'delivery_partners'>;
export type SubscriptionInsert = TablesInsert<'subscriptions'>;
export type NotificationInsert = TablesInsert<'notifications'>;
export type CategoryInsert = TablesInsert<'categories'>;
export type ReviewInsert = TablesInsert<'reviews'>;
export type GroupOrderInsert = TablesInsert<'group_orders'>;
export type PlanPricingInsert = TablesInsert<'plan_pricing'>;

// Update types
export type ProfileUpdate = TablesUpdate<'profiles'>;
export type VendorUpdate = TablesUpdate<'vendors'>;
export type MealUpdate = TablesUpdate<'meals'>;
export type OrderUpdate = TablesUpdate<'orders'>;
export type DeliveryPartnerUpdate = TablesUpdate<'delivery_partners'>;
export type SubscriptionUpdate = TablesUpdate<'subscriptions'>;
export type NotificationUpdate = TablesUpdate<'notifications'>;
export type CategoryUpdate = TablesUpdate<'categories'>;
export type ReviewUpdate = TablesUpdate<'reviews'>;
export type GroupOrderUpdate = TablesUpdate<'group_orders'>;
export type PlanPricingUpdate = TablesUpdate<'plan_pricing'>;

// Extended types with relationships
export type MealWithVendor = Meal & {
  vendor: Vendor;
};

export type OrderWithDetails = Order & {
  customer: Profile;
  vendor: Vendor;
  delivery_partner?: DeliveryPartner | null;
};

export type ReviewWithUser = Review & {
  user: Profile;
};

export type VendorWithMeals = Vendor & {
  meals: Meal[];
};

// Query result types
export type SupabaseQueryResult<T> = {
  data: T | null;
  error: Error | null;
};

export type SupabaseQueryArrayResult<T> = {
  data: T[] | null;
  error: Error | null;
};

// Realtime payload types
export type RealtimePayload<T> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
  schema: string;
  table: string;
  commit_timestamp: string;
};

// Auth types
export type AuthUser = {
  id: string;
  email: string;
  role: Enums<'user_role'>;
  profile?: Profile;
};

// Pagination types
export type PaginationOptions = {
  page: number;
  limit: number;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// Filter types for queries
export type MealFilters = {
  vendor_id?: string;
  category?: string;
  meal_type?: Enums<'meal_type'>;
  is_veg?: boolean;
  is_available?: boolean;
  min_price?: number;
  max_price?: number;
  search?: string;
};

export type OrderFilters = {
  customer_id?: string;
  vendor_id?: string;
  delivery_partner_id?: string;
  status?: Enums<'order_status'>;
  payment_status?: Enums<'payment_status'>;
  date_from?: string;
  date_to?: string;
};

export type VendorFilters = {
  cuisine?: string[];
  is_active?: boolean;
  min_rating?: number;
  search?: string;
};

// Sort options
export type SortOption = {
  column: string;
  ascending: boolean;
};

// Database function argument types
export type NearbyVendorsArgs = Functions<'nearby_vendors'>['Args'];
export type AssignDeliveryPartnerArgs = Functions<'assign_delivery_partner'>['Args'];
export type CalculateDeliveryFeeArgs = Functions<'calculate_delivery_fee'>['Args'];

// Utility type for making all properties optional recursively
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Type guard helpers
export function isProfile(obj: any): obj is Profile {
  return obj && typeof obj.id === 'string' && typeof obj.email === 'string';
}

export function isOrder(obj: any): obj is Order {
  return obj && typeof obj.id === 'string' && typeof obj.order_number === 'string';
}

export function isMeal(obj: any): obj is Meal {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
}

// Error handling types
export type SupabaseError = {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
};

export function isSupabaseError(error: any): error is SupabaseError {
  return error && typeof error.message === 'string';
}
