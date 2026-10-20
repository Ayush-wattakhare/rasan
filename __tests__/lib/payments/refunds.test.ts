/**
 * @jest-environment node
 */
import { createFakeSupabase } from '../../utils/fake-supabase';

const fake = createFakeSupabase();
const refundMock = jest.fn();

jest.mock('@/lib/supabase/server', () => ({ createServiceClient: () => fake.client }));
jest.mock('@/lib/payments/razorpay-client', () => ({
  getRazorpay: () => (process.env.TEST_NO_RAZORPAY ? null : { payments: { refund: refundMock } }),
}));

import {
  applyRefundWebhook,
  clampRefund,
  refundOrderPayment,
  refundStrayPayment,
  refundableAmount,
} from '@/lib/payments/refunds';

const ORDER_ID = '11111111-1111-4111-8111-111111111111';

function seedOrder(overrides: Record<string, any> = {}) {
  fake.tables.orders = [
    {
      id: ORDER_ID,
      order_number: 'ORD-1',
      customer_id: 'cust-1',
      total: 200,
      payment_status: 'paid',
      payment_method: 'upi',
      payment_id: 'pay_1',
      refunded_amount: 0,
      profiles: { name: 'Asha' },
      ...overrides,
    },
  ];
  fake.tables.refunds_ledger = [];
}

beforeEach(() => {
  refundMock.mockReset();
  delete process.env.TEST_NO_RAZORPAY;
  seedOrder();
});

describe('refund amounts', () => {
  it('never refunds more than what is left on the order', () => {
    expect(refundableAmount({ total: 200, refunded_amount: 50 })).toBe(150);
    expect(clampRefund(500, 150)).toBe(150);
    expect(clampRefund(-5, 150)).toBe(0);
    expect(clampRefund('abc', 150)).toBe(0);
    expect(clampRefund(99.999, 150)).toBe(100);
  });
});

describe('refundOrderPayment', () => {
  it('refunds through Razorpay, records the ledger row and marks the order refunded', async () => {
    refundMock.mockResolvedValue({ id: 'rfnd_1', status: 'processed' });

    const result = await refundOrderPayment({ orderId: ORDER_ID, amount: 200, reason: 'cancel', referenceId: 'CANCEL-1' });

    expect(result).toMatchObject({ ok: true, amount: 200, status: 'processed', gatewayRefundId: 'rfnd_1' });
    expect(refundMock).toHaveBeenCalledWith('pay_1', expect.objectContaining({ amount: 20000 }));
    expect(fake.tables.refunds_ledger[0]).toMatchObject({ reference_id: 'CANCEL-1', status: 'processed', gateway_refund_id: 'rfnd_1' });
    expect(fake.tables.orders[0]).toMatchObject({ refunded_amount: 200, payment_status: 'refunded' });
  });

  it('is idempotent: the same reference never refunds twice', async () => {
    refundMock.mockResolvedValue({ id: 'rfnd_1', status: 'pending' });
    await refundOrderPayment({ orderId: ORDER_ID, amount: 200, reason: 'cancel', referenceId: 'CANCEL-1' });
    const again = await refundOrderPayment({ orderId: ORDER_ID, amount: 200, reason: 'cancel', referenceId: 'CANCEL-1' });

    expect(again).toMatchObject({ ok: true, alreadyRequested: true });
    expect(refundMock).toHaveBeenCalledTimes(1);
  });

  it('keeps a partial refund as paid and caps a second refund at the remainder', async () => {
    refundMock.mockResolvedValue({ id: 'rfnd_a', status: 'processed' });
    await refundOrderPayment({ orderId: ORDER_ID, amount: 50, reason: 'missing item', referenceId: 'ADMIN-a' });
    expect(fake.tables.orders[0]).toMatchObject({ refunded_amount: 50, payment_status: 'paid' });

    refundMock.mockResolvedValue({ id: 'rfnd_b', status: 'processed' });
    const second = await refundOrderPayment({ orderId: ORDER_ID, amount: 500, reason: 'goodwill', referenceId: 'ADMIN-b' });
    expect(second).toMatchObject({ ok: true, amount: 150 });
    expect(fake.tables.orders[0]).toMatchObject({ refunded_amount: 200, payment_status: 'refunded' });
  });

  it('refuses cash orders (nothing was charged online)', async () => {
    seedOrder({ payment_method: 'cash', payment_id: null });
    const result = await refundOrderPayment({ orderId: ORDER_ID, amount: 200, reason: 'x', referenceId: 'R-1' });
    expect(result).toMatchObject({ ok: false, reason: 'not-paid' });
    expect(refundMock).not.toHaveBeenCalled();
  });

  it('queues the refund for manual handling when Razorpay is not configured', async () => {
    process.env.TEST_NO_RAZORPAY = '1';
    const result = await refundOrderPayment({ orderId: ORDER_ID, amount: 200, reason: 'x', referenceId: 'R-2' });
    expect(result).toMatchObject({ ok: false, reason: 'not-configured', queued: true });
    expect(fake.tables.refunds_ledger[0]).toMatchObject({ status: 'pending' });
    expect(fake.tables.orders[0].refunded_amount).toBe(0);
  });

  it('records a gateway failure and lets the same reference be retried', async () => {
    refundMock.mockRejectedValueOnce({ error: { description: 'Insufficient balance' } });
    const failed = await refundOrderPayment({ orderId: ORDER_ID, amount: 200, reason: 'x', referenceId: 'R-3' });
    expect(failed).toMatchObject({ ok: false, reason: 'gateway-error' });
    expect(fake.tables.refunds_ledger[0]).toMatchObject({ status: 'failed', failure_reason: 'Insufficient balance' });

    refundMock.mockResolvedValueOnce({ id: 'rfnd_retry', status: 'processed' });
    const retried = await refundOrderPayment({ orderId: ORDER_ID, amount: 200, reason: 'x', referenceId: 'R-3' });
    expect(retried).toMatchObject({ ok: true, gatewayRefundId: 'rfnd_retry' });
    expect(fake.tables.refunds_ledger).toHaveLength(1);
  });
});

describe('refund webhooks', () => {
  it('a failed refund is undone on the order so it can be refunded again', async () => {
    refundMock.mockResolvedValue({ id: 'rfnd_1', status: 'pending' });
    await refundOrderPayment({ orderId: ORDER_ID, amount: 200, reason: 'x', referenceId: 'R-4' });
    expect(fake.tables.orders[0]).toMatchObject({ refunded_amount: 200, payment_status: 'refunded' });

    await applyRefundWebhook('refund.failed', { id: 'rfnd_1' });
    expect(fake.tables.refunds_ledger[0].status).toBe('failed');
    expect(fake.tables.orders[0]).toMatchObject({ refunded_amount: 0, payment_status: 'paid' });
  });

  it('marks a processed refund', async () => {
    refundMock.mockResolvedValue({ id: 'rfnd_2', status: 'pending' });
    await refundOrderPayment({ orderId: ORDER_ID, amount: 100, reason: 'x', referenceId: 'R-5' });
    await applyRefundWebhook('refund.processed', { id: 'rfnd_2' });
    expect(fake.tables.refunds_ledger[0].status).toBe('processed');
  });
});

describe('refundStrayPayment', () => {
  it('refunds the stray payment itself (not the order payment) once', async () => {
    refundMock.mockResolvedValue({ id: 'rfnd_stray', status: 'pending' });
    const order = { id: ORDER_ID, customer_id: 'cust-1' };
    await refundStrayPayment({ paymentId: 'pay_dup', amountMinor: 20000, order, reason: 'duplicate' });
    await refundStrayPayment({ paymentId: 'pay_dup', amountMinor: 20000, order, reason: 'duplicate' });

    expect(refundMock).toHaveBeenCalledTimes(1);
    expect(refundMock).toHaveBeenCalledWith('pay_dup', expect.objectContaining({ amount: 20000 }));
    // The order's own refunded amount is untouched: that money was never part of it.
    expect(fake.tables.orders[0].refunded_amount).toBe(0);
  });
});
