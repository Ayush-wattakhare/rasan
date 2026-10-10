import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { createServiceClient } from '@/lib/supabase/server';
import { RASAN_COMMISSION_PERCENTAGE } from '@/lib/utils/constants';

export interface SettlementRecord {
  id: string;
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

const MEMORY_SETTLEMENTS: SettlementRecord[] = [
  {
    id: 'stl-1',
    utr_number: 'UTR-20261008-84291',
    recipient_id: 'vend-anita',
    recipient_name: 'Anita Sharma',
    recipient_role: 'vendor',
    business_name: "Anita's Home Kitchen",
    amount: 4278,
    gross_earnings: 4600,
    platform_commission: 322,
    payment_method: 'upi',
    account_target: 'anita.kitchen@okaxis',
    status: 'settled',
    requested_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    settled_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    notes: 'Weekly tiffin payout batch #41',
  },
  {
    id: 'stl-2',
    utr_number: 'UTR-20261008-39218',
    recipient_id: 'del-rohan',
    recipient_name: 'Rohan Sharma',
    recipient_role: 'delivery',
    amount: 1450,
    gross_earnings: 1450,
    platform_commission: 0,
    payment_method: 'imps',
    account_target: 'HDFC Bank •••• 9412',
    status: 'settled',
    requested_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
    settled_at: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
    notes: '28 Hyperlocal Delivery Bounties (Pimpri Hub)',
  },
  {
    id: 'stl-3',
    utr_number: 'PENDING-REQ-101',
    recipient_id: 'vend-sunita',
    recipient_name: 'Sunita Patil',
    recipient_role: 'vendor',
    business_name: 'Shree Ganesh Poli Bhaji',
    amount: 3534,
    gross_earnings: 3800,
    platform_commission: 266,
    payment_method: 'upi',
    account_target: 'sunita.patil@okhdfcbank',
    status: 'pending',
    requested_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    settled_at: null,
    notes: 'Daily dinner dispatch earnings',
  },
  {
    id: 'stl-4',
    utr_number: 'PENDING-REQ-102',
    recipient_id: 'del-vikram',
    recipient_name: 'Vikram Shinde',
    recipient_role: 'delivery',
    amount: 820,
    gross_earnings: 820,
    platform_commission: 0,
    payment_method: 'upi',
    account_target: 'vikram.delivery@paytm',
    status: 'pending',
    requested_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    settled_at: null,
    notes: 'Evening delivery surge missions',
  },
  {
    id: 'stl-5',
    utr_number: 'PENDING-REQ-103',
    recipient_id: 'vend-meena',
    recipient_name: 'Meena Deshmukh',
    recipient_role: 'vendor',
    business_name: 'Aaji Che Jevan (Pimpri)',
    amount: 6324,
    gross_earnings: 6800,
    platform_commission: 476,
    payment_method: 'neft',
    account_target: 'ICICI Bank •••• 5129',
    status: 'pending',
    requested_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    settled_at: null,
    notes: 'Monthly corporate lunch subscription batch',
  },
];

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    // Calculate Platform Commission & Payout Aggregates
    const settledList = MEMORY_SETTLEMENTS.filter((s) => s.status === 'settled');
    const pendingList = MEMORY_SETTLEMENTS.filter((s) => s.status === 'pending');

    const totalSettledAmount = settledList.reduce((acc, curr) => acc + curr.amount, 0);
    const totalPendingAmount = pendingList.reduce((acc, curr) => acc + curr.amount, 0);
    const totalCommissionEarned = MEMORY_SETTLEMENTS.reduce((acc, curr) => acc + curr.platform_commission, 0);
    const totalGrossGMV = MEMORY_SETTLEMENTS.reduce((acc, curr) => acc + curr.gross_earnings, 0);

    return NextResponse.json({
      success: true,
      settlements: MEMORY_SETTLEMENTS,
      metrics: {
        totalSettledAmount,
        totalPendingAmount,
        totalCommissionEarned,
        totalGrossGMV,
        commissionRatePercentage: RASAN_COMMISSION_PERCENTAGE,
        pendingApprovalsCount: pendingList.length,
        settledTransfersCount: settledList.length,
      },
    });
  } catch (err: any) {
    console.error('Error fetching settlements:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { settlementId, customUtr, notes } = body;

    const item = MEMORY_SETTLEMENTS.find((s) => s.id === settlementId);
    if (!item) {
      return NextResponse.json({ error: 'Settlement request not found' }, { status: 404 });
    }

    const generatedUtr = customUtr || `UTR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10000 + Math.random() * 90000)}`;

    item.status = 'settled';
    item.utr_number = generatedUtr;
    item.settled_at = new Date().toISOString();
    if (notes) item.notes = notes;

    // Dispatch system notification to recipient
    try {
      const serviceClient = createServiceClient();
      if (item.recipient_id && item.recipient_id.length > 5) {
        await serviceClient.from('notifications').insert({
          user_id: item.recipient_id,
          type: 'payment',
          title: `💸 Payout Settled: ₹${item.amount.toLocaleString('en-IN')}`,
          message: `Your requested payout of ₹${item.amount.toLocaleString('en-IN')} has been wired to ${item.account_target} via ${item.payment_method.toUpperCase()}. Bank Ref UTR: ${generatedUtr}.`,
          is_read: false,
        });
      }
    } catch {}

    return NextResponse.json({
      success: true,
      settlement: item,
      message: `₹${item.amount.toLocaleString('en-IN')} successfully wired to ${item.recipient_name} (${generatedUtr}).`,
    });
  } catch (err: any) {
    console.error('Error settling payout:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
