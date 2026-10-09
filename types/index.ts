// Core Types for HomelyEats Platform

export type UserRole = 'customer' | 'vendor' | 'delivery' | 'admin';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'wallet';

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'completed';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type VehicleType = 'bike' | 'scooter' | 'car';

export interface Address {
  street: string;
  city: string;
  state: string;
  zip_code: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  house_no?: string;
  building_name?: string;
  landmark?: string;
  tag?: 'home' | 'work' | 'friends_family' | 'other';
  receiver_name?: string;
  receiver_phone?: string;
  delivery_instructions?: string;
  delivery_preferences?: string[];
}

export interface Point {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface OrderItem {
  meal_id: string;
  name: string;
  quantity: number;
  price: number;
  customizations?: string[];
}

export interface TrackingUpdate {
  status: OrderStatus;
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
  };
  note?: string;
}

export interface OrderRating {
  food: number;
  delivery: number;
  comment?: string;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface OperatingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  is_open: boolean;
  open_time: string;
  close_time: string;
}

export interface BankDetails {
  account_number: string;
  ifsc_code: string;
  account_holder_name: string;
  bank_name?: string;
  upi_id?: string;
  preferred_payout_method?: 'upi' | 'bank';
}

export interface VendorDocuments {
  fssai_license: string;
  gst_number: string;
}

export interface DeliveryDocuments {
  driving_license: string;
  vehicle_rc: string;
  insurance: string;
}

export interface Earnings {
  today: number;
  this_week: number;
  this_month: number;
  total: number;
}

export interface SubscriptionDelivery {
  date: string;
  status: 'scheduled' | 'delivered' | 'skipped' | 'failed';
  order_id?: string;
}

export interface GroupParticipant {
  user_id: string;
  items: { meal_id: string; quantity: number }[];
  contribution: number;
}

// Cart Types
export type SubscriptionType = 'one-time' | 'weekly' | 'monthly';

export interface CartItem {
  meal_id: string;
  vendor_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  is_veg: boolean;
  // Subscription Options
  subscription_type: SubscriptionType;
  delivery_days: string[];
  delivery_time: string;
  discount_percentage?: number;
}

export interface Cart {
  items: CartItem[];
  vendor_id?: string;
  subtotal: number;
  base_subtotal?: number;
  total_savings?: number;
  platform_fee: number;
  delivery_fee: number;
  total: number;
}

// Filter Types
export interface MealFilters {
  category?: string;
  meal_type?: MealType;
  is_veg?: boolean;
  min_price?: number;
  max_price?: number;
  search?: string;
  sort_by?: 'price' | 'rating' | 'name';
  sort_order?: 'asc' | 'desc';
}

export interface VendorFilters {
  cuisine?: string[];
  min_rating?: number;
  is_open?: boolean;
  search?: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  type: 'order' | 'delivery' | 'payment' | 'promotion' | 'system' | 'subscription';
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}
