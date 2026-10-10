import { createClient } from '@/lib/supabase/client';
import { HANDOVER_EMBED } from '@/lib/utils/delivery-otp';
import type { Order, OrderFilters } from '@/lib/supabase/types';
import type { Address, OrderItem, PaymentMethod, SubscriptionType } from '@/types';

export type CreateOrderRequest = {
  items: {
    meal_id: string;
    quantity: number;
    subscription_type?: SubscriptionType;
    delivery_days?: string[];
    delivery_time?: string;
  }[];
  payment_method: PaymentMethod;
  delivery_address: Address;
  delivery_instructions?: string | null;
};

export class OrderService {
  private supabase = createClient();

  /**
   * Create a new order through the API, which prices it from the database.
   */
  async createOrder(request: CreateOrderRequest): Promise<Order> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const unavailable = Array.isArray(data.unavailableItems) && data.unavailableItems.length
        ? `: ${data.unavailableItems.join(', ')}`
        : '';
      throw new Error(`${data.error || 'Could not place order'}${unavailable}`);
    }
    return data as Order;
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    const { data, error } = await this.supabase
      .from('orders')
      .select(`*, ${HANDOVER_EMBED}`)
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get orders with filters
   */
  async getOrders(filters: OrderFilters = {}) {
    let query = this.supabase.from('orders').select(`*, ${HANDOVER_EMBED}`);

    if (filters.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }

    if (filters.vendor_id) {
      query = query.eq('vendor_id', filters.vendor_id);
    }

    if (filters.delivery_partner_id) {
      query = query.eq('delivery_partner_id', filters.delivery_partner_id);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.payment_status) {
      query = query.eq('payment_status', filters.payment_status);
    }

    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  /**
   * Rate an order
   */
  async rateOrder(
    orderId: string,
    rating: { food: number; delivery: number; comment?: string }
  ): Promise<Order> {
    const { data, error } = await this.supabase
      .from('orders')
      .update({ rating })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Calculate order totals
   */
  calculateOrderTotals(
    items: OrderItem[],
    deliveryFee: number,
    discount: number = 0
  ): {
    subtotal: number;
    tax: number;
    total: number;
  } {
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Tax is 5% of subtotal
    const tax = subtotal * 0.05;

    const total = subtotal + deliveryFee + tax - discount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  /**
   * Validate order items availability
   */
  async validateOrderItems(items: OrderItem[]): Promise<{
    valid: boolean;
    unavailableItems: string[];
  }> {
    const mealIds = items.map((item) => item.meal_id);

    const { data: meals, error } = await this.supabase
      .from('meals')
      .select('id, name, is_available, stock')
      .in('id', mealIds);

    if (error) throw error;

    const unavailableItems: string[] = [];

    for (const item of items) {
      const meal = meals.find((m) => m.id === item.meal_id);

      if (!meal) {
        unavailableItems.push(item.name);
        continue;
      }

      if (!meal.is_available) {
        unavailableItems.push(meal.name);
        continue;
      }

      if (meal.stock !== null && meal.stock < item.quantity) {
        unavailableItems.push(meal.name);
      }
    }

    return {
      valid: unavailableItems.length === 0,
      unavailableItems,
    };
  }
}

export const orderService = new OrderService();
