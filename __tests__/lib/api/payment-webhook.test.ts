/**
 * @jest-environment node
 */
import { createHmac } from 'crypto';
import { NextRequest } from 'next/server';
import { createFakeSupabase } from '../../utils/fake-supabase';

const fake = createFakeSupabase();
const refundMock = jest.fn();

jest.mock('@/lib/supabase/server', () => ({ createServiceClient: () => fake.client }));
jest.mock('@/lib/payments/razorpay-client', () => ({
  getRazorpay: () => ({ payments: { refund: refundMock } }),
  warnRazorpayConfigOnce: () => {},
}));
jest.mock('@/lib/notifications/transactional', () => ({ notifyOrderConfirmed: jest.fn(async () => undefined) }));

import { POST } from '@/app/api/payments/webhook/route';

const SECRET = 'whsec_test';
const ORDER_ID = '22222222-2222-4222-8222-222222222222';

function webhook(event: string, payment: Record<string, any>, eventId = `evt_${Math.random()}`) {
  const body = JSON.stringify({ event, payload: { payment: { entity: payment } } });
  const signature = createHmac('sha256', SECRET).update(body).digest('hex');
  return new NextRequest('https://rasan.test/api/payments/webhook', {
    method: 'POST',
    body,
    headers: { 'x-razorpay-signature': signature, 'x-razorpay-event-id': eventId },
  });
}

function seed(order: Record<string, any> = {}) {
  fake.tables.orders = [
    {
      id: ORDER_ID,
      order_number: 'ORD-9',
      total: 150,
      status: 'pending',
      payment_status: 'pending',
      payment_id: null,
      payment_order_id: 'order_A',
      customer_id: 'cust-9',
      delivery_address: {},
      profiles: { name: 'Ravi', phone: null },
      refunded_amount: 0,
      ...order,
    },
  ];
  fake.tables.refunds_ledger = [];
  fake.tables.subscriptions = [];
  fake.tables.payment_events = [];
  fake.tables.notifications = [];
}

beforeEach(() => {
  process.env.RAZORPAY_WEBHOOK_SECRET = SECRET;
  refundMock.mockReset();
  refundMock.mockResolvedValue({ id: 'rfnd_x', status: 'pending' });
  seed();
});

describe('payment webhook', () => {
  it('rejects a bad signature', async () => {
    const req = webhook('payment.captured', { id: 'pay_1', order_id: 'order_A', amount: 15000 });
    req.headers.set('x-razorpay-signature', 'deadbeef');
    expect((await POST(req)).status).toBe(403);
  });

  it('confirms the order on a matching capture', async () => {
    const res = await POST(webhook('payment.captured', { id: 'pay_1', order_id: 'order_A', amount: 15000, currency: 'INR' }));
    expect(res.status).toBe(200);
    expect(fake.tables.orders[0]).toMatchObject({ payment_status: 'paid', payment_id: 'pay_1', status: 'confirmed' });
    expect(refundMock).not.toHaveBeenCalled();
  });

  it('treats payment.captured + order.paid for the same payment as one payment', async () => {
    await POST(webhook('payment.captured', { id: 'pay_1', order_id: 'order_A', amount: 15000 }));
    await POST(webhook('order.paid', { id: 'pay_1', order_id: 'order_A', amount: 15000 }));
    expect(refundMock).not.toHaveBeenCalled();
  });

  it('refunds a second, different payment for an already-paid order', async () => {
    await POST(webhook('payment.captured', { id: 'pay_1', order_id: 'order_A', amount: 15000 }));
    await POST(webhook('payment.captured', { id: 'pay_2', order_id: 'order_A', amount: 15000 }));
    expect(refundMock).toHaveBeenCalledTimes(1);
    expect(refundMock).toHaveBeenCalledWith('pay_2', expect.objectContaining({ amount: 15000 }));
  });

  it('refunds a capture that arrives after the order was cancelled', async () => {
    seed({ status: 'cancelled' });
    await POST(webhook('payment.captured', { id: 'pay_3', order_id: 'order_A', amount: 15000 }));
    expect(fake.tables.orders[0].payment_status).toBe('pending');
    expect(refundMock).toHaveBeenCalledWith('pay_3', expect.anything());
    expect(fake.tables.refunds_ledger[0]).toMatchObject({ reference_id: 'AUTO-pay_3' });
  });

  it('refunds a capture whose amount does not match the order', async () => {
    await POST(webhook('payment.captured', { id: 'pay_4', order_id: 'order_A', amount: 100 }));
    expect(fake.tables.orders[0].payment_status).toBe('pending');
    expect(refundMock).toHaveBeenCalledWith('pay_4', expect.objectContaining({ amount: 100 }));
  });

  it('finds the order through the notes when the gateway order was replaced', async () => {
    await POST(
      webhook('payment.captured', { id: 'pay_5', order_id: 'order_OLD', amount: 15000, notes: { order_id: ORDER_ID } })
    );
    expect(fake.tables.orders[0]).toMatchObject({ payment_status: 'paid', payment_id: 'pay_5' });
  });

  it('ignores a replayed event id', async () => {
    const first = webhook('payment.captured', { id: 'pay_1', order_id: 'order_A', amount: 15000 }, 'evt_same');
    await POST(first);
    fake.tables.orders[0].payment_status = 'pending'; // would be re-processed if not de-duplicated
    const res = await POST(webhook('payment.captured', { id: 'pay_1', order_id: 'order_A', amount: 15000 }, 'evt_same'));
    expect(await res.json()).toMatchObject({ duplicate: true });
  });

  it('refuses all events when the secret is missing', async () => {
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    expect((await POST(webhook('payment.captured', { id: 'p', order_id: 'o', amount: 1 }))).status).toBe(503);
  });
});
