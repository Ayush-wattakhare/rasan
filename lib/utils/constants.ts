// Application Constants

export const APP_NAME = 'Rasan';
export const APP_DESCRIPTION = 'Real homemade food delivered anytime - Ghar ka khana for students & working professionals';

// Rasan Platform Commission & Financial Split (Introductory Launch Tier)
export const RASAN_COMMISSION_PERCENTAGE = 7; // 7% Platform Commission Cut
export const RASAN_COMMISSION_RATE = 0.07;
export const VENDOR_PAYOUT_RATE = 0.93; // 93% Home Chef Payout

// Hyperlocal Delivery Pricing Rules (Free Delivery Under 7 KM)
export const FREE_DELIVERY_RADIUS_KM = 7; // Free Delivery Under 7 KM
export const BASE_DELIVERY_FEE_ABOVE_7KM = 25; // Base fee above 7 KM
export const PER_KM_DELIVERY_FEE_ABOVE_7KM = 10; // Extra charge per KM above 7 KM

/**
 * Calculates delivery fee based on distance:
 * - Free (₹0) under 7 KM
 * - Chargeable above 7 KM (₹25 base + ₹10/km for distance beyond 7 km)
 */
export function calculateDeliveryFeeByDistance(distanceKm: number): {
  fee: number;
  isFree: boolean;
  distanceKm: number;
} {
  if (distanceKm <= FREE_DELIVERY_RADIUS_KM) {
    return {
      fee: 0,
      isFree: true,
      distanceKm,
    };
  }
  const extraKm = Math.ceil(distanceKm - FREE_DELIVERY_RADIUS_KM);
  const fee = BASE_DELIVERY_FEE_ABOVE_7KM + (extraKm * PER_KM_DELIVERY_FEE_ABOVE_7KM);
  return {
    fee,
    isFree: false,
    distanceKm,
  };
}

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  PICKED_UP: 'picked_up',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

// User Roles
export const USER_ROLES = {
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
  DELIVERY: 'delivery',
  ADMIN: 'admin',
} as const;

// Meal Types
export const MEAL_TYPES = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
  SNACK: 'snack',
} as const;

// Subscription Status
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const;

// Vehicle Types
export const VEHICLE_TYPES = {
  BIKE: 'bike',
  SCOOTER: 'scooter',
  CAR: 'car',
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Delivery defaults
export const DEFAULT_DELIVERY_RADIUS_KM = 12;
export const BASE_DELIVERY_FEE = 25;
export const PER_KM_DELIVERY_FEE = 10;

// Ratings
export const MIN_RATING = 1;
export const MAX_RATING = 5;

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Rate Limiting
export const RATE_LIMIT_REQUESTS = 100;
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
