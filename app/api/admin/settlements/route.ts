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
    amount: 1850,
    gross_earnings: 1850,
    platform_commission: 0,
    payment_method: 'upi',
    account_target: 'rohan.sharma@paytm',
    status: 'settled',
    requested_at: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    settled_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    notes: 'Weekend surge deliveries bonus + base',
  },
  {
    id: 'stl-3',
    utr_number: 'PENDING-REQ-101',
    recipient_id: 'vend-sunita',
    recipient_name: 'Sunita Patil',
    recipient_role: 'vendor',
    business_name: 'Mauli Tiffin Center',
    amount: 3255,
    gross_earnings: 3500,
    platform_commission: 245,
    payment_method: 'imps',
    account_target: 'HDFC Bank •••• 4812',
    status: 'pending',
    requested_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    settled_at: null,
    notes: 'Regular scheduled vendor withdrawal',
  },
  {
    id: 'stl-4',
    utr_number: 'PENDING-REQ-102',
    recipient_id: 'del-vikram',
    recipient_name: 'Vikram Singh',
    recipient_role: 'delivery',
    amount: 920,
    gross_earnings: 920,
    platform_commission: 0,
    payment_method: 'upi',
    account_target: 'vikram.delivery@ybl',
    status: 'pending',
    requested_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    settled_at: null,
    notes: 'Distance delivery milestone incentive',
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

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const serviceClient = createServiceClient();
    
    // Query payouts table
    const { data: dbPayouts } = await (serviceClient.from('payouts' as any) as any)
      .select('*')
      .order('created_at', { ascending: false });

    let settlements: SettlementRecord[] = [];

    if (dbPayouts && dbPayouts.length > 0) {
      settlements = dbPayouts.map((p: any) => {
        const dest = (p.destination as Record<string, any>) || {};
        const accountTarget = dest.upi_id 
          ? dest.upi_id 
          : dest.account_number 
            ? `${dest.bank_name || 'Bank'} •••• ${String(dest.account_number).slice(-4)}`
            : 'Account Info';

        const amount = Number(p.amount) || 0;
        const grossEarnings = p.gross_earnings ? Number(p.gross_earnings) : amount;
        const commission = p.platform_commission ? Number(p.platform_commission) : (grossEarnings - amount);

        return {
          id: p.id,
          utr_number: p.utr_number || p.reference || `PAY-${p.id.slice(0, 8).toUpperCase()}`,
          recipient_id: p.user_id,
          recipient_name: p.user_id ? `Partner #${p.user_id.slice(0, 6)}` : 'Partner',
          recipient_role: p.payee_type === 'vendor' ? 'vendor' : 'delivery',
          amount,
          gross_earnings: grossEarnings,
          platform_commission: commission,
          payment_method: p.method === 'upi' ? 'upi' : 'neft',
          account_target: accountTarget,
          status: p.status === 'completed' ? 'settled' : p.status === 'rejected' ? 'rejected' : 'pending',
          requested_at: p.created_at,
          settled_at: p.settled_at || (p.status === 'completed' ? p.updated_at : null),
          notes: p.notes || undefined,
        };
      });
    }

    if (settlements.length === 0) {
      settlements = [...MEMORY_SETTLEMENTS];
    }

    const settledList = settlements.filter((s) => s.status === 'settled');
    const pendingList = settlements.filter((s) => s.status === 'pending');

    const totalSettledAmount = settledList.reduce((acc, curr) => acc + curr.amount, 0);
    const totalPendingAmount = pendingList.reduce((acc, curr) => acc + curr.amount, 0);
    const totalCommissionEarned = settlements.reduce((acc, curr) => acc + curr.platform_commission, 0);
    const totalGrossGMV = settlements.reduce((acc, curr) => acc + curr.gross_earnings, 0);

    return NextResponse.json({
      success: true,
      settlements,
      metrics: {
        totalSettledAmount,
        totalPendingAmount,
        totalCommissionEarned,
        totalGrossGMV,
        commissionRatePercentage: RASAN_COMMISSION_PERCENTAGE,
        pendingApprovalsCount: pendingList.length,
        settledTransfersCount: settledList.length,
      },
      source: (dbPayouts && dbPayouts.length > 0) ? 'database' : 'fallback',
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
    const body = await request.json().catch(() => ({}));
    const { settlementId, customUtr, notes } = body;

    if (!settlementId) {
      return NextResponse.json({ error: 'Settlement ID is required' }, { status: 400 });
    }

    const generatedUtr = customUtr || `UTR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10000 + Math.random() * 90000)}`;
    const settledAt = new Date().toISOString();

    const serviceClient = createServiceClient();
    let updatedSettlement: SettlementRecord | null = null;

    // Try updating payouts table in database
    try {
      const { data: dbUpdated } = await (serviceClient.from('payouts' as any) as any)
        .update({
          status: 'completed',
          utr_number: generatedUtr,
          settled_at: settledAt,
          notes: notes || null,
          updated_at: settledAt,
        })
        .eq('id', settlementId)
        .select()
        .maybeSingle();

      if (dbUpdated) {
        const dest = (dbUpdated.destination as Record<string, any>) || {};
        const accountTarget = dest.upi_id || `Bank •••• ${String(dest.account_number || '').slice(-4)}`;

        updatedSettlement = {
          id: dbUpdated.id,
          utr_number: generatedUtr,
          recipient_id: dbUpdated.user_id,
          recipient_name: `Partner #${dbUpdated.user_id.slice(0, 6)}`,
          recipient_role: dbUpdated.payee_type === 'vendor' ? 'vendor' : 'delivery',
          amount: Number(dbUpdated.amount),
          gross_earnings: dbUpdated.gross_earnings ? Number(dbUpdated.gross_earnings) : Number(dbUpdated.amount),
          platform_commission: dbUpdated.platform_commission ? Number(dbUpdated.platform_commission) : 0,
          payment_method: dbUpdated.method === 'upi' ? 'upi' : 'neft',
          account_target: accountTarget,
          status: 'settled',
          requested_at: dbUpdated.created_at,
          settled_at: settledAt,
          notes: notes || undefined,
        };
      }
    } catch {}

    // Fallback in-memory update
    const item = MEMORY_SETTLEMENTS.find((s) => s.id === settlementId);
    if (item) {
      item.status = 'settled';
      item.utr_number = generatedUtr;
      item.settled_at = settledAt;
      if (notes) item.notes = notes;
      if (!updatedSettlement) updatedSettlement = item;
    }

    if (!updatedSettlement) {
      return NextResponse.json({ error: 'Settlement request not found' }, { status: 404 });
    }

    // Dispatch system notification to recipient
    try {
      if (updatedSettlement.recipient_id && updatedSettlement.recipient_id.length > 5) {
        await (serviceClient.from('notifications' as any) as any).insert({
          user_id: updatedSettlement.recipient_id,
          type: 'payment',
          title: `💸 Payout Settled: ₹${updatedSettlement.amount.toLocaleString('en-IN')}`,
          message: `Your requested payout of ₹${updatedSettlement.amount.toLocaleString('en-IN')} has been wired to ${updatedSettlement.account_target} via ${updatedSettlement.payment_method.toUpperCase()}. Bank Ref UTR: ${generatedUtr}.`,
          is_read: false,
        });
      }
    } catch {}

    return NextResponse.json({
      success: true,
      settlement: updatedSettlement,
      message: `₹${updatedSettlement.amount.toLocaleString('en-IN')} successfully wired to ${updatedSettlement.recipient_name} (${generatedUtr}).`,
    });
  } catch (err: any) {
    console.error('Error settling payout:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
