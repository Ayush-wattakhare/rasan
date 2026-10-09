import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export interface RefundRecord {
  id: string;
  reference_id: string;
  order_id: string;
  recipient_id: string;
  recipient_role: 'customer' | 'vendor' | 'delivery';
  recipient_name: string;
  amount: number;
  type: 'customer_refund' | 'vendor_compensation' | 'rider_waiting_fee' | 'goodwill_credit';
  reason: string;
  status: 'processed' | 'pending' | 'failed';
  gateway: 'upi' | 'razorpay' | 'wallet' | 'bank_transfer';
  processed_at: string;
}

const MEMORY_REFUNDS: RefundRecord[] = [
  {
    id: 'ref-1',
    reference_id: 'REF-20260901-8411',
    order_id: 'ORD-7518',
    recipient_id: 'cust-1',
    recipient_role: 'customer',
    recipient_name: 'Avatta Khare',
    amount: 50,
    type: 'customer_refund',
    reason: 'Missing item in order (Sweet Dish)',
    status: 'processed',
    gateway: 'upi',
    processed_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ref-2',
    reference_id: 'REF-20260901-8412',
    order_id: 'ORD-8921',
    recipient_id: 'del-1',
    recipient_role: 'delivery',
    recipient_name: 'Rohan Sharma',
    amount: 35,
    type: 'rider_waiting_fee',
    reason: 'Kitchen delay compensation (>18 mins waiting)',
    status: 'processed',
    gateway: 'wallet',
    processed_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ref-3',
    reference_id: 'REF-20260901-8413',
    order_id: 'ORD-6219',
    recipient_id: 'vend-1',
    recipient_role: 'vendor',
    recipient_name: "Anita's Kitchen",
    amount: 140,
    type: 'vendor_compensation',
    reason: 'Customer cancellation after meal preparation (70% food cost)',
    status: 'processed',
    gateway: 'bank_transfer',
    processed_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  }
];

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const totalRefunded = MEMORY_REFUNDS.reduce((sum, r) => sum + r.amount, 0);

    return NextResponse.json({
      success: true,
      refunds: MEMORY_REFUNDS,
      totalRefunded,
      totalCount: MEMORY_REFUNDS.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, recipientId, recipientRole, recipientName, amount, type, reason, gateway } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    const newRefund: RefundRecord = {
      id: `ref-${Date.now()}`,
      reference_id: `REF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      order_id: orderId || 'N/A',
      recipient_id: recipientId || 'guest',
      recipient_role: recipientRole || 'customer',
      recipient_name: recipientName || 'Beneficiary',
      amount: Number(amount),
      type: type || 'customer_refund',
      reason: reason || 'Admin initiated settlement',
      status: 'processed',
      gateway: gateway || 'upi',
      processed_at: new Date().toISOString(),
    };

    MEMORY_REFUNDS.unshift(newRefund);

    // Push notification to recipient
    try {
      const serviceClient = createServiceClient();
      if (recipientId && recipientId.length > 10) {
        await serviceClient.from('notifications').insert({
          user_id: recipientId,
          type: 'payment',
          title: `💰 ₹${amount} Settlement Credited`,
          message: `A settlement of ₹${amount} has been processed via ${newRefund.gateway.toUpperCase()}. Reason: ${reason}.`,
          is_read: false,
        });
      }
    } catch {}

    return NextResponse.json({
      success: true,
      refund: newRefund,
      message: `₹${amount} ${type.replace(/_/g, ' ')} processed successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
