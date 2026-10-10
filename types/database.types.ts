/**
 * Database types generated from Supabase schema
 * This file defines the complete type structure for the HomelyEats database
 */

import type {
  UserRole,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  SubscriptionStatus,
  MealType,
  VehicleType,
  Address,
  Point,
  OperatingHours,
  BankDetails,
  VendorDocuments,
  DeliveryDocuments,
  NutritionalInfo,
  OrderItem,
  TrackingUpdate,
  OrderRating,
  Earnings,
  SubscriptionDelivery,
  GroupParticipant,
} from './index';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string | null;
          role: UserRole;
          avatar_url: string | null;
          address: Address | null;
          is_active: boolean;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          phone?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          address?: Address | null;
          is_active?: boolean;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          phone?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          address?: Address | null;
          is_active?: boolean;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vendors: {
        Row: {
          id: string;
          user_id: string;
          business_name: string;
          description: string | null;
          cuisine: string[];
          location: Point;
          address: string;
          phone: string;
          email: string;
          operating_hours: OperatingHours;
          rating: number;
          total_orders: number;
          is_active: boolean;
          bank_details: BankDetails | null;
          documents: VendorDocuments | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name: string;
          description?: string | null;
          cuisine: string[];
          location: Point;
          address: string;
          phone: string;
          email: string;
          operating_hours: OperatingHours;
          rating?: number;
          total_orders?: number;
          is_active?: boolean;
          bank_details?: BankDetails | null;
          documents?: VendorDocuments | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_name?: string;
          description?: string | null;
          cuisine?: string[];
          location?: Point;
          address?: string;
          phone?: string;
          email?: string;
          operating_hours?: OperatingHours;
          rating?: number;
          total_orders?: number;
          is_active?: boolean;
          bank_details?: BankDetails | null;
          documents?: VendorDocuments | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'vendors_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      meals: {
        Row: {
          id: string;
          vendor_id: string;
          name: string;
          description: string | null;
          category: string;
          meal_type: MealType;
          price: number;
          discount_price: number | null;
          image_url: string | null;
          ingredients: string[];
          allergens: string[];
          nutritional_info: NutritionalInfo | null;
          is_veg: boolean;
          is_available: boolean;
          stock: number | null;
          preparation_time: number;
          rating: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          name: string;
          description?: string | null;
          category: string;
          meal_type: MealType;
          price: number;
          discount_price?: number | null;
          image_url?: string | null;
          ingredients?: string[];
          allergens?: string[];
          nutritional_info?: NutritionalInfo | null;
          is_veg?: boolean;
          is_available?: boolean;
          stock?: number | null;
          preparation_time: number;
          rating?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          name?: string;
          description?: string | null;
          category?: string;
          meal_type?: MealType;
          price?: number;
          discount_price?: number | null;
          image_url?: string | null;
          ingredients?: string[];
          allergens?: string[];
          nutritional_info?: NutritionalInfo | null;
          is_veg?: boolean;
          is_available?: boolean;
          stock?: number | null;
          preparation_time?: number;
          rating?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'meals_vendor_id_fkey';
            columns: ['vendor_id'];
            referencedRelation: 'vendors';
            referencedColumns: ['id'];
          }
        ];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string;
          vendor_id: string;
          delivery_partner_id: string | null;
          items: OrderItem[];
          subtotal: number;
          delivery_fee: number;
          tax: number;
          discount: number;
          total: number;
          status: OrderStatus;
          payment_status: PaymentStatus;
          payment_method: PaymentMethod;
          payment_id: string | null;
          delivery_address: Address;
          delivery_instructions: string | null;
          estimated_delivery_time: string | null;
          actual_delivery_time: string | null;
          tracking_updates: TrackingUpdate[];
          rating: OrderRating | null;
          payment_order_id: string | null;
          compensated_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string;
          customer_id: string;
          vendor_id: string;
          delivery_partner_id?: string | null;
          items: OrderItem[];
          subtotal: number;
          delivery_fee: number;
          tax: number;
          discount?: number;
          total: number;
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          payment_method: PaymentMethod;
          payment_id?: string | null;
          delivery_address: Address;
          delivery_instructions?: string | null;
          estimated_delivery_time?: string | null;
          actual_delivery_time?: string | null;
          tracking_updates?: TrackingUpdate[];
          rating?: OrderRating | null;
          payment_order_id?: string | null;
          compensated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          customer_id?: string;
          vendor_id?: string;
          delivery_partner_id?: string | null;
          items?: OrderItem[];
          subtotal?: number;
          delivery_fee?: number;
          tax?: number;
          discount?: number;
          total?: number;
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          payment_method?: PaymentMethod;
          payment_id?: string | null;
          delivery_address?: Address;
          delivery_instructions?: string | null;
          estimated_delivery_time?: string | null;
          actual_delivery_time?: string | null;
          tracking_updates?: TrackingUpdate[];
          rating?: OrderRating | null;
          payment_order_id?: string | null;
          compensated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_vendor_id_fkey';
            columns: ['vendor_id'];
            referencedRelation: 'vendors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_delivery_partner_id_fkey';
            columns: ['delivery_partner_id'];
            referencedRelation: 'delivery_partners';
            referencedColumns: ['id'];
          }
        ];
      };
      delivery_partners: {
        Row: {
          id: string;
          user_id: string;
          vehicle_type: VehicleType;
          vehicle_number: string;
          license_number: string;
          is_online: boolean;
          current_location: Point | null;
          rating: number;
          total_deliveries: number;
          earnings: Earnings;
          documents: DeliveryDocuments | null;
          bank_details: BankDetails | null;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vehicle_type: VehicleType;
          vehicle_number: string;
          license_number: string;
          is_online?: boolean;
          current_location?: Point | null;
          rating?: number;
          total_deliveries?: number;
          earnings?: Earnings;
          documents?: DeliveryDocuments | null;
          bank_details?: BankDetails | null;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          vehicle_type?: VehicleType;
          vehicle_number?: string;
          license_number?: string;
          is_online?: boolean;
          current_location?: Point | null;
          rating?: number;
          total_deliveries?: number;
          earnings?: Earnings;
          documents?: DeliveryDocuments | null;
          bank_details?: BankDetails | null;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'delivery_partners_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          customer_id: string;
          vendor_id: string;
          plan_type: 'daily' | 'weekly' | 'monthly';
          meal_type: MealType | 'all';
          start_date: string;
          end_date: string;
          delivery_days: string[];
          delivery_time: string;
          address: Address;
          price: number;
          status: SubscriptionStatus;
          payment_status: PaymentStatus;
          auto_renew: boolean;
          deliveries: SubscriptionDelivery[];
          order_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          vendor_id: string;
          plan_type: 'daily' | 'weekly' | 'monthly';
          meal_type: MealType | 'all';
          start_date: string;
          end_date: string;
          delivery_days: string[];
          delivery_time: string;
          address: Address;
          price: number;
          status?: SubscriptionStatus;
          payment_status?: PaymentStatus;
          auto_renew?: boolean;
          deliveries?: SubscriptionDelivery[];
          order_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          vendor_id?: string;
          plan_type?: 'daily' | 'weekly' | 'monthly';
          meal_type?: MealType | 'all';
          start_date?: string;
          end_date?: string;
          delivery_days?: string[];
          delivery_time?: string;
          address?: Address;
          price?: number;
          status?: SubscriptionStatus;
          payment_status?: PaymentStatus;
          auto_renew?: boolean;
          deliveries?: SubscriptionDelivery[];
          order_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'subscriptions_vendor_id_fkey';
            columns: ['vendor_id'];
            referencedRelation: 'vendors';
            referencedColumns: ['id'];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'order' | 'delivery' | 'payment' | 'promotion' | 'system' | 'subscription';
          title: string;
          message: string;
          data: Json | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'order' | 'delivery' | 'payment' | 'promotion' | 'system' | 'subscription';
          title: string;
          message: string;
          data?: Json | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'order' | 'delivery' | 'payment' | 'promotion' | 'system' | 'subscription';
          title?: string;
          message?: string;
          data?: Json | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          meal_id: string;
          user_id: string;
          order_id: string;
          rating: number;
          comment: string | null;
          images: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          meal_id: string;
          user_id: string;
          order_id: string;
          rating: number;
          comment?: string | null;
          images?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          meal_id?: string;
          user_id?: string;
          order_id?: string;
          rating?: number;
          comment?: string | null;
          images?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reviews_meal_id_fkey';
            columns: ['meal_id'];
            referencedRelation: 'meals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_order_id_fkey';
            columns: ['order_id'];
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          }
        ];
      };
      group_orders: {
        Row: {
          id: string;
          group_id: string;
          host_id: string;
          vendor_id: string;
          participants: GroupParticipant[];
          status: 'open' | 'closed' | 'ordered';
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          host_id: string;
          vendor_id: string;
          participants?: GroupParticipant[];
          status?: 'open' | 'closed' | 'ordered';
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          host_id?: string;
          vendor_id?: string;
          participants?: GroupParticipant[];
          status?: 'open' | 'closed' | 'ordered';
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_orders_host_id_fkey';
            columns: ['host_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_orders_vendor_id_fkey';
            columns: ['vendor_id'];
            referencedRelation: 'vendors';
            referencedColumns: ['id'];
          }
        ];
      };
      plan_pricing: {
        Row: {
          id: string;
          plan_type: 'daily' | 'weekly' | 'monthly';
          meal_type: MealType | 'all';
          days_per_week: number;
          base_price: number;
          discount_percentage: number;
          final_price: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plan_type: 'daily' | 'weekly' | 'monthly';
          meal_type: MealType | 'all';
          days_per_week: number;
          base_price: number;
          discount_percentage?: number;
          final_price: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          plan_type?: 'daily' | 'weekly' | 'monthly';
          meal_type?: MealType | 'all';
          days_per_week?: number;
          base_price?: number;
          discount_percentage?: number;
          final_price?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_handover_codes: {
        Row: {
          order_id: string;
          code: string;
          created_at: string;
        };
        Insert: {
          order_id: string;
          code: string;
          created_at?: string;
        };
        Update: {
          code?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'order_handover_codes_order_id_fkey';
            columns: ['order_id'];
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          }
        ];
      };
      payouts: {
        Row: {
          id: string;
          user_id: string;
          payee_type: 'vendor' | 'delivery';
          amount: number;
          method: 'upi' | 'bank';
          destination: Record<string, unknown>;
          status: 'pending' | 'processing' | 'completed' | 'rejected';
          reference: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          payee_type: 'vendor' | 'delivery';
          amount: number;
          method: 'upi' | 'bank';
          destination?: Record<string, unknown>;
          status?: 'pending' | 'processing' | 'completed' | 'rejected';
          reference: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'pending' | 'processing' | 'completed' | 'rejected';
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      request_payout: {
        Args: {
          p_user_id: string;
          p_payee_type: 'vendor' | 'delivery';
          p_amount: number;
          p_method: 'upi' | 'bank';
          p_destination: Record<string, unknown>;
          p_commission_rate: number;
        };
        Returns: Database['public']['Tables']['payouts']['Row'];
      };
      nearby_vendors: {
        Args: {
          lat: number;
          lng: number;
          radius_km: number;
        };
        Returns: Database['public']['Tables']['vendors']['Row'][];
      };
      assign_delivery_partner: {
        Args: {
          order_id: string;
        };
        Returns: string | null;
      };
      calculate_delivery_fee: {
        Args: {
          vendor_location: Point;
          delivery_location: Point;
        };
        Returns: number;
      };
    };
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
      subscription_status: SubscriptionStatus;
      meal_type: MealType;
      vehicle_type: VehicleType;
    };
  };
}
