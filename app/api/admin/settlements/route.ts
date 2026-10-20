import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { createServiceClient } from '@/lib/supabase/server';
import { isUuid } from '@/lib/utils/validation-ids';
import { RASAN_COMMISSION_PERCENTAGE } from '@/lib/utils/constants';
import type { SettlementRecord } from '@/lib/payouts/settlement-types';

const MISSING_FUNCTION = new Set(['PGRST202', '42883']);

function toRecord(p: any, names: Map<string, { name: string; business?: string }>): SettlementRecord {
  const dest = (p.destination as Record<string, any>) || {};
  const accountTarget = dest.upi_id
    ? dest.upi_id
    : dest.account_number
      ? `${dest.bank_name || 'Bank'} •••• ${String(dest.account_number).slice(-4)}`
      : 'No payout details';
  const amount = Number(p.amount) || 0;
  const gross = p.gross_earnings ? Number(p.gross_earnings) : amount;
  const who = names.get(p.user_id);
  return {
    id: p.id,
    utr_number: p.utr_number || p.reference,
    recipient_id: p.user_id,
    recipient_name: who?.name || 'Partner',
    business_name: who?.business,
    recipient_role: p.payee_type === 'vendor' ? 'vendor' : 'delivery',
    amount,
    gross_earnings: gross,
    platform_commission: p.platform_commission ? Number(p.platform_commission) : Math.max(0, gross - amount),
    payment_method: p.method === 'upi' ? 'upi' : 'neft',
    account_target: accountTarget,
    status: p.status === 'completed' ? 'settled' : p.status === 'rejected' ? 'rejected' : 'pending',
    requested_at: p.created_at,
    settled_at: p.settled_at || null,
    notes: p.notes || undefined,
  };
}

/** Payout requests (database only). */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const db = createServiceClient();
    const { data: payouts, error } = await (db.from('payouts' as any) as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw error;

    const userIds = Array.from(new Set(((payouts || []) as any[]).map((p) => p.user_id).filter(Boolean)));
    const names = new Map<string, { name: string; business?: string }>();
    if (userIds.length > 0) {
      const [{ data: profiles }, { data: vendors }] = await Promise.all([
        db.from('profiles').select('id, name').in('id', userIds),
        db.from('vendors').select('user_id, business_name').in('user_id', userIds),
      ]);
      for (const p of profiles || []) names.set(p.id, { name: p.name || 'Partner' });
      for (const v of vendors || []) {
        const current = names.get(v.user_id as string) || { name: 'Partner' };
        names.set(v.user_id as string, { ...current, business: v.business_name as string });
      }
    }

    const settlements = ((payouts || []) as any[]).map((p) => toRecord(p, names));
    const settled = settlements.filter((s) => s.status === 'settled');
    const pending = settlements.filter((s) => s.status === 'pending');
    const live = settlements.filter((s) => s.status !== 'rejected');

    return NextResponse.json({
      success: true,
      settlements,
      metrics: {
        totalSettledAmount: settled.reduce((acc, s) => acc + s.amount, 0),
        totalPendingAmount: pending.reduce((acc, s) => acc + s.amount, 0),
        totalCommissionEarned: live.reduce((acc, s) => acc + s.platform_commission, 0),
        totalGrossGMV: live.reduce((acc, s) => acc + s.gross_earnings, 0),
        commissionRatePercentage: RASAN_COMMISSION_PERCENTAGE,
        pendingApprovalsCount: pending.length,
        settledTransfersCount: settled.length,
      },
    });
  } catch (err) {
    console.error('Error fetching settlements:', err);
    return NextResponse.json({ error: 'Could not load settlements' }, { status: 500 });
  }
}

/**
 * POST { settlementId, customUtr, notes }                  -> mark a pending payout as paid
 * POST { settlementId, action: 'reject', reason }          -> reject it and restore the balance
 *
 * Rasan doesn't move the money itself (no RazorpayX yet): finance pays the
 * partner from the bank, then records the real UTR here. Only pending payouts
 * can be settled or rejected, exactly once.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const { settlementId, customUtr, notes, action, reason } = body ?? {};
    if (!isUuid(settlementId)) {
      return NextResponse.json({ error: 'Settlement ID is required' }, { status: 400 });
    }
    const db = createServiceClient();
    const isReject = action === 'reject';

    let payout: any = null;
    if (isReject) {
      const rejectReason = typeof reason === 'string' && reason.trim() ? reason.trim().slice(0, 300) : 'Rejected by admin';
      const { data, error } = await (db as any).rpc('reject_payout', { p_payout_id: settlementId, p_reason: rejectReason });
      if (error) {
        if (MISSING_FUNCTION.has(error.code)) {
          return NextResponse.json({ error: 'Apply migration 008 to enable rejecting payouts' }, { status: 501 });
        }
        return NextResponse.json({ error: error.message || 'Could not reject payout' }, { status: 409 });
      }
      payout = data;
    } else {
      const utr = typeof customUtr === 'string' ? customUtr.trim() : '';
      if (utr.length < 6 || utr.length > 60) {
        return NextResponse.json({ error: 'Enter the bank / UPI reference (UTR) of the transfer you made' }, { status: 400 });
      }
      const cleanNotes = typeof notes === 'string' ? notes.trim().slice(0, 500) : null;
      const { data, error } = await (db as any).rpc('settle_payout', {
        p_payout_id: settlementId,
        p_utr: utr,
        p_notes: cleanNotes,
      });
      if (error && MISSING_FUNCTION.has(error.code)) {
        // Migration 008 not applied: same guarded update without the RPC.
        const { data: updated } = await (db.from('payouts' as any) as any)
          .update({ status: 'completed', utr_number: utr, settled_at: new Date().toISOString(), notes: cleanNotes })
          .eq('id', settlementId)
          .in('status', ['pending', 'processing'])
          .select()
          .maybeSingle();
        if (!updated) return NextResponse.json({ error: 'Payout is not awaiting settlement' }, { status: 409 });
        payout = updated;
      } else if (error) {
        return NextResponse.json({ error: error.message || 'Could not settle payout' }, { status: 409 });
      } else {
        payout = data;
      }
    }

    const amount = Number(payout?.amount || 0).toLocaleString('en-IN');
    if (payout?.user_id) {
      await db.from('notifications').insert({
        user_id: payout.user_id,
        type: 'payment',
        title: isReject ? 'Payout Request Rejected' : `💸 Payout Sent: ₹${amount}`,
        message: isReject
          ? `Your payout request of ₹${amount} was not approved${payout.notes ? `: ${payout.notes}` : ''}. The amount is back in your available balance.`
          : `Your payout of ₹${amount} has been transferred. Bank reference (UTR): ${payout.utr_number}.`,
        is_read: false,
      });
    }

    return NextResponse.json({
      success: true,
      message: isReject ? `Payout of ₹${amount} rejected; balance restored.` : `Payout of ₹${amount} marked as paid (${payout.utr_number}).`,
    });
  } catch (err) {
    console.error('Error updating payout:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
