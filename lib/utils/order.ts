import { OrderItem } from '@/types';

/**
 * Calculate order subtotal
 */
export function calculateSubtotal(items: OrderItem[]): number {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

/**
 * Calculate tax (GST 5%)
 */
export function calculateTax(subtotal: number): number {
  const TAX_RATE = 0.05; // 5% GST
  return Math.round(subtotal * TAX_RATE * 100) / 100;
}

/**
 * Calculate order total
 */
export function calculateOrderTotal(
  subtotal: number,
  deliveryFee: number,
  tax: number,
  discount: number = 0
): number {
  return subtotal + deliveryFee + tax - discount;
}

/**
 * Generate unique order number
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');

  return `ORD-${year}${month}${day}-${random}`;
}

/**
 * Get order status color
 */
export function getOrderStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    preparing: 'bg-purple-100 text-purple-800',
    ready: 'bg-indigo-100 text-indigo-800',
    picked_up: 'bg-cyan-100 text-cyan-800',
    out_for_delivery: 'bg-orange-100 text-orange-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return statusColors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Get payment status color
 */
export function getPaymentStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  };

  return statusColors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Format order status for display
 */
export function formatOrderStatus(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Check if order can be cancelled
 */
export function canCancelOrder(status: string): boolean {
  const cancellableStatuses = ['pending'];
  return cancellableStatuses.includes(status);
}

/**
 * Check if order can be rated
 */
export function canRateOrder(status: string): boolean {
  return status === 'delivered';
}

/**
 * Validate order items from cart
 */
export function validateOrderItems(items: OrderItem[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (items.length === 0) {
    errors.push('Cart is empty');
  }

  items.forEach((item, index) => {
    if (item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Invalid quantity`);
    }
    if (item.price <= 0) {
      errors.push(`Item ${index + 1}: Invalid price`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
