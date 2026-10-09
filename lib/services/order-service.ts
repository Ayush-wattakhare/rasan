import { createClient } from '@/lib/supabase/client';
import type {
  Order,
  OrderInsert,
  OrderUpdate,
  OrderFilters,
} from '@/lib/supabase/types';
import type { OrderItem, TrackingUpdate } from '@/types';

export class OrderService {
  private supabase = createClient();

  /**
   * Create a new order
   */
  async createOrder(orderData: OrderInsert): Promise<Order> {
    const { data, error } = await this.supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    const { data, error } = await this.supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get orders with filters
   */
  async getOrders(filters: OrderFilters = {}) {
    let query = this.supabase.from('orders').select('*');

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
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: Order['status'],
    note?: string
  ): Promise<Order> {
    // Get current order
    const order = await this.getOrderById(orderId);
    if (!order) throw new Error('Order not found');

    // Create tracking update
    const trackingUpdate: TrackingUpdate = {
      status,
      timestamp: new Date().toISOString(),
      note: note || undefined,
    };

    // Update order
    const updates: OrderUpdate = {
      status,
      tracking_updates: [...(order.tracking_updates || []), trackingUpdate],
    };

    // If status is delivered, set actual delivery time
    if (status === 'delivered') {
      updates.actual_delivery_time = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update order payment status
   */
  async updatePaymentStatus(
    orderId: string,
    paymentStatus: Order['payment_status'],
    paymentId?: string
  ): Promise<Order | any> {
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_status: paymentStatus,
            payment_id: paymentId,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          return data.order || data;
        }
      } catch (err) {
        console.warn('API updatePaymentStatus error, falling back to direct:', err);
      }
    }

    const updates: OrderUpdate = {
      payment_status: paymentStatus,
    };

    if (paymentId) {
      updates.payment_id = paymentId;
    }

    if (paymentStatus === 'paid') {
      updates.status = 'confirmed';
    }

    const { data, error } = await this.supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

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
   * Cancel an order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    return this.updateOrderStatus(orderId, 'cancelled', reason);
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
