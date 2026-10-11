import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { RASAN_COMMISSION_RATE } from '@/lib/utils/constants';

export const MIN_PAYOUT_AMOUNT = 50;

const UPI_PATTERN = /^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/;
const ACCOUNT_PATTERN = /^\d{9,18}$/;
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

type PayeeType = 'vendor' | 'delivery';

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

/**
 * Records a payout request after an atomic balance check in the database
 * (request_payout(), migration 003). Nothing is transferred here: the payout
 * is created as `pending` for finance to process.
 */
export async function handlePayoutRequest(request: Request, userId: string, payeeType: PayeeType) {
  const body = await request.json().catch(() => null);
  const amount = Number(body?.amount);
  const method = body?.method;

  if (!Number.isFinite(amount) || amount < MIN_PAYOUT_AMOUNT) {
    return bad(`Minimum withdrawal amount is ₹${MIN_PAYOUT_AMOUNT}`);
  }
  if (Math.round(amount * 100) !== amount * 100) {
    return bad('Amount can have at most 2 decimal places');
  }
  if (method !== 'upi' && method !== 'bank') {
    return bad('Choose UPI or bank transfer');
  }

  let destination: Record<string, string>;
  if (method === 'upi') {
    const upiId = String(body?.upiId || '').trim();
    if (!UPI_PATTERN.test(upiId)) return bad('Enter a valid UPI ID');
    destination = { upi_id: upiId };
  } else {
    const account = String(body?.bankDetails?.account_number || '').trim();
    const ifsc = String(body?.bankDetails?.ifsc_code || '').trim().toUpperCase();
    const holder = String(body?.bankDetails?.account_holder_name || '').trim().slice(0, 120);
    const bankName = String(body?.bankDetails?.bank_name || '').trim().slice(0, 120);
    if (!ACCOUNT_PATTERN.test(account)) return bad('Enter a valid bank account number');
    if (!IFSC_PATTERN.test(ifsc)) return bad('Enter a valid IFSC code');
    if (!holder) return bad('Enter the account holder name');
    destination = {
      account_number: account,
      ifsc_code: ifsc,
      account_holder_name: holder,
      bank_name: bankName,
    };
  }

  const serviceClient = createServiceClient();
  const table = payeeType === 'vendor' ? 'vendors' : 'delivery_partners';

  // Remember the payout destination (allow-listed fields only).
  const { data: owner } = await serviceClient
    .from(table)
    .select('id, bank_details')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!owner) {
    return bad(payeeType === 'vendor' ? 'Vendor profile not found' : 'Delivery partner record not found', 404);
  }

  await serviceClient
    .from(table)
    .update({
      bank_details: {
        ...((owner.bank_details as unknown as Record<string, unknown>) || {}),
        ...destination,
        preferred_payout_method: method,
      } as any,
    })
    .eq('id', owner.id);

  const { data: payout, error } = await serviceClient.rpc('request_payout', {
    p_user_id: userId,
    p_payee_type: payeeType,
    p_amount: amount,
    p_method: method,
    p_destination: destination,
    p_commission_rate: RASAN_COMMISSION_RATE,
  });

  if (error || !payout) {
    if (error?.message?.includes('Insufficient balance')) {
      return bad('Amount exceeds your available balance', 409);
    }
    console.error('request_payout error:', error);
    return bad('Failed to request payout', 500);
  }

  const maskedDestination =
    method === 'upi' ? destination.upi_id : `•••• ${destination.account_number.slice(-4)}`;

  try {
    await serviceClient.from('notifications').insert({
      user_id: userId,
      type: 'payment',
      title: '💸 Payout Requested',
      message: `Your payout of ₹${amount.toLocaleString('en-IN')} to ${maskedDestination} is being processed. Ref: ${payout.reference}`,
      is_read: false,
    });
  } catch {
    // Notifications are best-effort.
  }

  return NextResponse.json({
    success: true,
    transaction: {
      id: payout.reference,
      amount,
      method,
      destination: maskedDestination,
      status: payout.status,
      timestamp: payout.created_at,
    },
  });
}
