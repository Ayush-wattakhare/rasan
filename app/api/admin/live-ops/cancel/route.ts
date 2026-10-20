import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/guards';
import { isUuid } from '@/lib/utils/validation-ids';
import { refundOrderPayment } from '@/lib/payments/refunds';
import { releaseOrderStock } from '@/lib/orders/stock';
import { cancelPlanForOrder } from '@/lib/subscriptions/from-order';

/** Admin cancels a live order, optionally refunding the customer through Razorpay. */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const { orderId, reason, faultAttribution, refundCustomer, refundAmount } = body ?? {};

    if (!isUuid(orderId)) {
      return NextResponse.json({ error: 'A valid orderId is required' }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const { data: order, error: fetchError } = await serviceClient
      .from('orders')
      .select('id, order_number, status, payment_status, payment_method, total, customer_id, vendor_id, delivery_partner_id')
      .eq('id', orderId)
      .maybeSingle();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return NextResponse.json({ error: `Order is already ${order.status}` }, { status: 409 });
    }

    // Conditional on the current status so a concurrent transition isn't overwritten.
    const { data: cancelled, error: updateError } = await serviceClient
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('status', order.status)
      .select('id')
      .maybeSingle();

    if (updateError) {
      console.error('Live-ops cancel error:', updateError);
      return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
    }
    if (!cancelled) {
      return NextResponse.json({ error: 'Order status changed. Please refresh.' }, { status: 409 });
    }

    await releaseOrderStock(orderId);
    await cancelPlanForOrder(orderId);

    const note = typeof reason === 'string' && reason.trim() ? reason.trim().slice(0, 300) : 'Operational cancellation';

    // Refund only money actually received online; never more than what is left.
    let refunded = 0;
    let refundState: 'none' | 'initiated' | 'queued' | 'failed' = 'none';
    let refundMessage = '';
    const paidOnline = order.payment_status === 'paid' && order.payment_method !== 'cash';
    if (refundCustomer && paidOnline) {
      const outcome = await refundOrderPayment({
        orderId,
        amount: Number(refundAmount ?? order.total),
        reason: `Admin cancellation (${faultAttribution || 'general'}): ${note}`,
        referenceId: `ADMIN-CANCEL-${orderId}`,
      });
      if (outcome.ok) {
        refunded = outcome.amount;
        refundState = 'initiated';
      } else {
        refundState = outcome.queued ? 'queued' : 'failed';
        refundMessage = outcome.message;
      }
    }

    const orderLabel = order.order_number || order.id.slice(0, 8);
    const customerRefundLine =
      refundState === 'initiated'
        ? ` A refund of ₹${refunded.toFixed(2)} has been initiated to your original payment method.`
        : refundState === 'queued'
          ? ' Your refund is being processed by our team.'
          : '';

    const notifications: any[] = [];
    if (order.customer_id) {
      notifications.push({
        user_id: order.customer_id,
        type: 'order',
        title: 'Order Cancelled',
        message: `Order #${orderLabel} has been cancelled. Reason: ${note}.${customerRefundLine}`,
        is_read: false,
      });
    }
    if (order.vendor_id) {
      const { data: vendor } = await serviceClient.from('vendors').select('user_id').eq('id', order.vendor_id).maybeSingle();
      if (vendor?.user_id) {
        notifications.push({
          user_id: vendor.user_id,
          type: 'order',
          title: 'Order Cancelled by Rasan',
          message: `Order #${orderLabel} was cancelled by our operations team. Reason: ${note}.`,
          is_read: false,
        });
      }
    }
    if (order.delivery_partner_id) {
      const { data: rider } = await serviceClient
        .from('delivery_partners')
        .select('user_id')
        .eq('id', order.delivery_partner_id)
        .maybeSingle();
      if (rider?.user_id) {
        notifications.push({
          user_id: rider.user_id,
          type: 'delivery',
          title: 'Delivery Cancelled',
          message: `Order #${orderLabel} was cancelled. You no longer need to deliver it.`,
          is_read: false,
        });
      }
    }
    if (notifications.length > 0) {
      const { error: notifyError } = await serviceClient.from('notifications').insert(notifications);
      if (notifyError) console.warn('Live-ops cancel notifications failed:', notifyError.message);
    }

    return NextResponse.json({
      success: true,
      message:
        refundState === 'failed' || refundState === 'queued'
          ? `Order #${orderLabel} cancelled. Refund needs attention: ${refundMessage}`
          : `Order #${orderLabel} cancelled.${refunded > 0 ? ` Refund of ₹${refunded.toFixed(2)} initiated.` : ''}`,
      orderId,
      refundState,
      refundAmount: refunded,
    });
  } catch (err: any) {
    console.error('Live-ops cancel error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
