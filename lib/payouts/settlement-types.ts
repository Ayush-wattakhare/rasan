/** A payout request as shown on the admin settlements screen. */
export interface SettlementRecord {
  id: string;
  /** Bank / UPI reference once paid, otherwise the internal payout reference. */
  utr_number: string;
  recipient_id: string;
  recipient_name: string;
  recipient_role: 'vendor' | 'delivery';
  business_name?: string;
  amount: number;
  gross_earnings: number;
  platform_commission: number;
  payment_method: 'upi' | 'imps' | 'neft';
  account_target: string;
  status: 'pending' | 'settled' | 'rejected';
  requested_at: string;
  settled_at: string | null;
  notes?: string;
}
