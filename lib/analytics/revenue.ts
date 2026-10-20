import { RASAN_COMMISSION_RATE } from '@/lib/utils/constants';

/**
 * Revenue figures shared by the admin and vendor dashboards, so every screen
 * counts money the same way.
 *
 * An order counts once the money is real: delivered (cash collected / online
 * paid), or paid online and still active. Cancelled and unpaid checkouts never
 * count, and refunds are subtracted.
 */

export type RevenueOrder = {
  status: string | null;
  payment_status: string | null;
  payment_method?: string | null;
  total: number | string | null;
  subtotal?: number | string | null;
  tax?: number | string | null; // platform fee
  refunded_amount?: number | string | null;
  created_at?: string | null;
};

const n = (v: unknown) => Number(v) || 0;

export function countsAsRevenue(order: RevenueOrder): boolean {
  if (order.status === 'cancelled') return false;
  if (order.payment_status === 'refunded') return false;
  if (order.status === 'delivered') return true;
  return order.payment_status === 'paid';
}

/** Money actually kept from an order (total minus refunds). */
export function netOrderValue(order: RevenueOrder): number {
  return Math.max(0, n(order.total) - n(order.refunded_amount));
}

export function revenueSummary(orders: RevenueOrder[], commissionRate = RASAN_COMMISSION_RATE) {
  let gross = 0;
  let food = 0;
  let platformFees = 0;
  let count = 0;
  for (const order of orders) {
    if (!countsAsRevenue(order)) continue;
    count++;
    const refunded = n(order.refunded_amount);
    gross += netOrderValue(order);
    // Refunds come out of the food value first (that's what the kitchen is paid on).
    food += Math.max(0, n(order.subtotal ?? order.total) - refunded);
    platformFees += n(order.tax);
  }
  const vendorShare = food * (1 - commissionRate);
  const platformEarnings = gross - vendorShare;
  const round = (v: number) => Math.round(v * 100) / 100;
  return {
    orders: count,
    grossRevenue: round(gross),
    vendorShare: round(vendorShare),
    platformEarnings: round(platformEarnings),
    platformFees: round(platformFees),
    averageOrderValue: count > 0 ? round(gross / count) : 0,
    commissionRate,
  };
}
