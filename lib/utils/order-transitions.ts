import type { OrderStatus } from '@/types';

export type OrderActor = 'vendor' | 'delivery' | 'admin';

export const ORDER_STATUSES: readonly OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'picked_up',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

/**
 * Allowed status changes per actor. Customers never set status directly;
 * they cancel through /api/orders/[id]/cancel.
 */
const TRANSITIONS: Record<OrderActor, Partial<Record<OrderStatus, readonly OrderStatus[]>>> = {
  vendor: {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['ready'],
  },
  delivery: {
    ready: ['picked_up'],
    picked_up: ['out_for_delivery'],
    out_for_delivery: ['delivered'],
  },
  admin: {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['picked_up', 'cancelled'],
    picked_up: ['out_for_delivery', 'cancelled'],
    out_for_delivery: ['delivered', 'cancelled'],
  },
};

/** The UI uses "ready_for_pickup" for the database value "ready". */
export function normalizeOrderStatus(status: unknown): OrderStatus | null {
  if (status === 'ready_for_pickup') return 'ready';
  return typeof status === 'string' && (ORDER_STATUSES as readonly string[]).includes(status)
    ? (status as OrderStatus)
    : null;
}

export function canTransition(actor: OrderActor, from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[actor][from]?.includes(to) ?? false;
}
