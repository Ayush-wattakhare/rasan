import { z } from 'zod';

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be 10 digits'),
  role: z.enum(['customer', 'vendor', 'delivery']),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Profile Schemas
export const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be 10 digits').optional(),
});

export const addressSchema = z.object({
  street: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zip_code: z.string().regex(/^[0-9]{6}$/, 'ZIP code must be 6 digits'),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
});

// Meal Schemas
export const mealSchema = z.object({
  name: z.string().min(3, 'Meal name must be at least 3 characters'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  price: z.number().positive('Price must be positive'),
  discount_price: z.number().positive().optional(),
  ingredients: z.array(z.string()),
  allergens: z.array(z.string()),
  is_veg: z.boolean(),
  stock: z.number().int().nonnegative().optional(),
  preparation_time: z.number().int().positive('Preparation time must be positive'),
});

// Order Schemas
export const orderSchema = z.object({
  items: z.array(z.object({
    meal_id: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1, 'At least one item is required'),
  delivery_address: addressSchema,
  delivery_instructions: z.string().optional(),
  payment_method: z.enum(['cash', 'card', 'upi', 'wallet']),
});

export const ratingSchema = z.object({
  food: z.number().int().min(1).max(5),
  delivery: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

// Subscription Schemas
export const subscriptionSchema = z.object({
  vendor_id: z.string().uuid(),
  plan_type: z.enum(['daily', 'weekly', 'monthly']),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'all']),
  start_date: z.string().refine((date) => new Date(date) >= new Date(), {
    message: 'Start date must be in the future',
  }),
  end_date: z.string(),
  delivery_days: z.array(z.string()).min(1, 'Select at least one delivery day'),
  delivery_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  address: addressSchema,
}).refine((data) => new Date(data.end_date) > new Date(data.start_date), {
  message: 'End date must be after start date',
  path: ['end_date'],
});

// Delivery Partner Schemas
export const deliveryPartnerSchema = z.object({
  vehicle_type: z.enum(['bike', 'scooter', 'car']),
  vehicle_number: z.string().min(5, 'Vehicle number is required'),
  license_number: z.string().min(5, 'License number is required'),
});

export const locationUpdateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// Review Schema
export const reviewSchema = z.object({
  meal_id: z.string().uuid(),
  order_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

// Vendor Schemas
export const vendorSchema = z.object({
  business_name: z.string().min(3, 'Business name must be at least 3 characters'),
  description: z.string().optional(),
  cuisine: z.array(z.string()).min(1, 'Select at least one cuisine'),
  address: z.string().min(5, 'Address is required'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be 10 digits'),
  email: z.string().email('Invalid email address'),
  operating_hours: z.record(
    z.string(),
    z.object({
      is_open: z.boolean(),
      open_time: z.string(),
      close_time: z.string(),
    })
  ),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type MealInput = z.infer<typeof mealSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type RatingInput = z.infer<typeof ratingSchema>;
export type SubscriptionInput = z.infer<typeof subscriptionSchema>;
export type DeliveryPartnerInput = z.infer<typeof deliveryPartnerSchema>;
export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type VendorInput = z.infer<typeof vendorSchema>;
