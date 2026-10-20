export type RefundType = 'customer_refund' | 'vendor_compensation' | 'rider_waiting_fee' | 'goodwill_credit';
export type RefundStatus = 'processed' | 'pending' | 'failed';
export type RefundGateway = 'upi' | 'razorpay' | 'wallet' | 'bank_transfer';

/** A refunds_ledger row as returned by /api/admin/refunds. */
export interface RefundRecord {
  id: string;
  reference_id: string;
  order_id: string | null;
  order_number?: string | null;
  recipient_id: string | null;
  recipient_role: 'customer' | 'vendor' | 'delivery';
  recipient_name: string;
  amount: number;
  type: RefundType;
  reason: string;
  status: RefundStatus;
  gateway: RefundGateway;
  gateway_refund_id?: string | null;
  failure_reason?: string | null;
  processed_at: string | null;
  created_at: string;
}

export const PARTNER_PAYOUT_TYPES: readonly RefundType[] = [
  'vendor_compensation',
  'rider_waiting_fee',
  'goodwill_credit',
];
