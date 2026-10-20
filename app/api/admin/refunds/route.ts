import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { createServiceClient } from '@/lib/supabase/server';
import { isUuid } from '@/lib/utils/validation-ids';
import { refundOrderPayment, refundStrayPayment } from '@/lib/payments/refunds';
import { toMinorUnits } from '@/lib/payments/order-payment';
import { PARTNER_PAYOUT_TYPES, type RefundRecord, type RefundType } from '@/lib/payments/refund-types';

const MAX_PARTNER_PAYMENT = 10000;
const REF_PATTERN = /^[A-Za-z0-9-]{8,80}$/;

/** Refunds & compensation ledger (database only). */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { data, error } = await (createServiceClient().from('refunds_ledger' as any) as any)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    console.error('Refunds ledger fetch failed:', error);
    return NextResponse.json({ error: 'Could not load the refunds ledger' }, { status: 500 });
  }

  const refunds = ((data || []) as RefundRecord[]).map((r) => ({ ...r, amount: Number(r.amount) }));
  const sum = (rows: RefundRecord[]) => rows.reduce((s, r) => s + Number(r.amount), 0);
  const processed = refunds.filter((r) => r.status === 'processed');

  return NextResponse.json({
    success: true,
    refunds,
    totalRefunded: sum(processed),
    customerRefunded: sum(processed.filter((r) => r.type === 'customer_refund')),
    partnerPaid: sum(processed.filter((r) => r.type !== 'customer_refund')),
    needsAttention: refunds.filter((r) => r.status !== 'processed').length,
    totalCount: refunds.length,
  });
}

/** Finds an order by UUID or by order number (what admins see on screen). */
async function findOrder(ref: string) {
  const value = ref.trim();
  const column = isUuid(value) ? 'id' : 'order_number';
  const { data } = await createServiceClient()
    .from('orders')
    .select('id, order_number, customer_id')
    .eq(column, column === 'id' ? value : value.toUpperCase())
    .maybeSingle();
  return data;
}

/**
 * Customer refunds go back through Razorpay to the original payment.
 * Partner compensation (vendor / rider / goodwill) is recorded as 'pending'
 * until finance pays it and marks it processed (PATCH).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const type = body?.type as RefundType;
    const amount = Number(body?.amount);
    const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 500) : '';
    // One key per form submission: a double click or retry can't refund twice.
    const key = typeof body?.idempotencyKey === 'string' && REF_PATTERN.test(body.idempotencyKey)
      ? body.idempotencyKey
      : randomUUID();

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }
    if (!reason) {
      return NextResponse.json({ error: 'A reason is required' }, { status: 400 });
    }

    if (type === 'customer_refund') {
      const orderRef = typeof body?.orderId === 'string' ? body.orderId.trim() : '';
      if (!orderRef) {
        return NextResponse.json({ error: 'Customer refunds need the order ID or order number' }, { status: 400 });
      }
      const order = await findOrder(orderRef);
      if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

      const outcome = await refundOrderPayment({
        orderId: order.id,
        amount,
        reason: `Admin refund: ${reason}`,
        referenceId: `ADMIN-${key}`,
      });

      if (!outcome.ok) {
        const status = outcome.reason === 'not-paid' || outcome.reason === 'nothing-left' ? 409 : outcome.queued ? 202 : 502;
        return NextResponse.json(
          { success: outcome.queued === true, queued: outcome.queued === true, error: outcome.message },
          { status }
        );
      }

      if (!outcome.alreadyRequested && order.customer_id) {
        await createServiceClient().from('notifications').insert({
          user_id: order.customer_id,
          type: 'payment',
          title: 'Refund Initiated',
          message: `A refund of ₹${outcome.amount.toFixed(2)} for order #${order.order_number} has been sent to your original payment method. It usually arrives in 5–7 working days.`,
          is_read: false,
        });
      }

      return NextResponse.json({
        success: true,
        refund: outcome,
        message: outcome.alreadyRequested
          ? 'This refund was already requested.'
          : `Refund of ₹${outcome.amount.toFixed(2)} sent to Razorpay (${outcome.status}).`,
      });
    }

    if (!PARTNER_PAYOUT_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
    if (amount > MAX_PARTNER_PAYMENT) {
      return NextResponse.json({ error: `Amount cannot exceed ₹${MAX_PARTNER_PAYMENT}` }, { status: 400 });
    }
    if (!isUuid(body?.recipientId)) {
      return NextResponse.json({ error: 'Select the partner to compensate' }, { status: 400 });
    }

    const db = createServiceClient();
    const { data: recipient } = await db
      .from('profiles')
      .select('id, name, role')
      .eq('id', body.recipientId)
      .maybeSingle();
    if (!recipient) return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    const role = recipient.role === 'vendor' || recipient.role === 'delivery' ? recipient.role : 'customer';

    const order = typeof body?.orderId === 'string' && body.orderId.trim() ? await findOrder(body.orderId) : null;

    const { data: row, error } = await (db.from('refunds_ledger' as any) as any)
      .insert({
        reference_id: `COMP-${key}`,
        order_id: order?.id ?? null,
        order_number: order?.order_number ?? null,
        recipient_id: recipient.id,
        recipient_role: role,
        recipient_name: recipient.name || 'Partner',
        amount: Math.round(amount * 100) / 100,
        type,
        reason,
        status: 'pending',
        gateway: body?.gateway === 'upi' ? 'upi' : 'bank_transfer',
        processed_at: null,
      })
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: true, message: 'This payment was already recorded.' });
      }
      console.error('Compensation insert failed:', error);
      return NextResponse.json({ error: 'Could not record the payment' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      refund: row,
      message: `₹${amount} recorded as pending. Mark it processed once it has been paid.`,
    });
  } catch (err) {
    console.error('Admin refunds POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH { referenceId, action }
 *  - 'retry': re-sends a failed customer refund to Razorpay.
 *  - 'mark_processed': a pending manual payment was paid outside the gateway
 *    (needs the bank / UPI reference).
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const referenceId = typeof body?.referenceId === 'string' ? body.referenceId : '';
  if (!REF_PATTERN.test(referenceId)) {
    return NextResponse.json({ error: 'Invalid reference' }, { status: 400 });
  }

  const db = createServiceClient();
  const { data: row } = await (db.from('refunds_ledger' as any) as any)
    .select('*')
    .eq('reference_id', referenceId)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: 'Ledger entry not found' }, { status: 404 });

  if (body?.action === 'retry') {
    if (row.type !== 'customer_refund' || row.status !== 'failed') {
      return NextResponse.json({ error: 'Only failed customer refunds can be retried' }, { status: 409 });
    }
    // A stray capture is refunded on its own payment id, never on the order's real payment.
    if (String(row.reference_id).startsWith('AUTO-') && row.payment_id) {
      const stray = await refundStrayPayment({
        paymentId: row.payment_id,
        amountMinor: toMinorUnits(Number(row.amount)),
        order: row.order_id ? { id: row.order_id, order_number: row.order_number, customer_id: row.recipient_id } : null,
        reason: row.reason,
      });
      if (!stray.ok) return NextResponse.json({ error: stray.message }, { status: 502 });
      return NextResponse.json({ success: true, message: stray.message });
    }
    if (!row.order_id) {
      return NextResponse.json({ error: 'This refund has no order to refund against' }, { status: 409 });
    }
    const outcome = await refundOrderPayment({
      orderId: row.order_id,
      amount: Number(row.amount),
      reason: row.reason,
      referenceId,
    });
    if (!outcome.ok) return NextResponse.json({ error: outcome.message }, { status: 502 });
    return NextResponse.json({ success: true, message: `Refund re-sent (${outcome.status}).` });
  }

  if (body?.action === 'mark_processed') {
    const utr = typeof body?.utr === 'string' ? body.utr.trim() : '';
    if (utr.length < 6) {
      return NextResponse.json({ error: 'Enter the bank / UPI reference (UTR)' }, { status: 400 });
    }
    // A customer refund already handed to Razorpay is completed by its webhook, not by hand.
    if (row.gateway_refund_id) {
      return NextResponse.json({ error: 'This refund is tracked by Razorpay' }, { status: 409 });
    }
    const { data: updated } = await (db.from('refunds_ledger' as any) as any)
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        reason: `${row.reason} · Paid manually (ref ${utr.slice(0, 40)})`.slice(0, 500),
        updated_at: new Date().toISOString(),
      })
      .eq('reference_id', referenceId)
      .in('status', ['pending', 'failed'])
      .select('id')
      .maybeSingle();
    if (!updated) return NextResponse.json({ error: 'Entry is already processed' }, { status: 409 });

    // A customer refund paid by hand still counts against the order.
    // (Stray captures, AUTO-*, were never part of the order total.)
    if (row.type === 'customer_refund' && row.order_id && !String(row.reference_id).startsWith('AUTO-')) {
      const { data: order } = await (db.from('orders') as any)
        .select('total, refunded_amount')
        .eq('id', row.order_id)
        .maybeSingle();
      if (order) {
        const after = Math.min(Number((order as any).refunded_amount || 0) + Number(row.amount), Number(order.total));
        await (db.from('orders') as any)
          .update({ refunded_amount: after, ...(after >= Number(order.total) ? { payment_status: 'refunded' } : {}) })
          .eq('id', row.order_id);
      }
    }

    if (row.recipient_id) {
      await db.from('notifications').insert({
        user_id: row.recipient_id,
        type: 'payment',
        title: row.type === 'customer_refund' ? 'Refund Sent' : 'Payment Sent',
        message: `₹${Number(row.amount).toFixed(2)} has been sent to you (reference ${utr.slice(0, 40)}).`,
        is_read: false,
      });
    }
    return NextResponse.json({ success: true, message: 'Marked as processed.' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
