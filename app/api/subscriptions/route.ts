import { createClient, createServiceClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/guards';
import { WEEKDAYS } from '@/lib/pricing/order-pricing';
import {
  PLAN_LENGTH_DAYS,
  PLAN_TYPES,
  SUBSCRIPTION_MEAL_TYPES,
  calculateSubscriptionPricing,
  type PlanType,
} from '@/lib/pricing/subscription-pricing';
import { NextResponse } from 'next/server';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_START_DAYS_AHEAD = 30;

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}

function isValidStartDate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const start = new Date(`${value}T00:00:00Z`).getTime();
  if (!Number.isFinite(start)) return false;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const dayMs = 24 * 60 * 60 * 1000;
  return start >= today.getTime() - dayMs && start <= today.getTime() + MAX_START_DAYS_AHEAD * dayMs;
}

/**
 * Creates a subscription. Price, payment status and end date are decided
 * here, never taken from the request:
 * - from checkout (`order_id`): price and payment status come from that order
 *   (one subscription per order);
 * - standalone: price from the plan table, payment status 'pending'.
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  try {
    const body = await request.json();
    const { order_id, meal_type, start_date, delivery_days, delivery_time, address, auto_renew } = body ?? {};

    const days: string[] = Array.isArray(delivery_days)
      ? Array.from(new Set(delivery_days.map(String)))
      : [];

    if (
      !SUBSCRIPTION_MEAL_TYPES.includes(meal_type) ||
      !isValidStartDate(start_date) ||
      days.length === 0 ||
      !days.every((d) => (WEEKDAYS as readonly string[]).includes(d)) ||
      typeof delivery_time !== 'string' ||
      !delivery_time ||
      !address ||
      typeof address !== 'object'
    ) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    let planType: PlanType;
    let vendorId: string;
    let price: number;
    let paymentStatus: 'paid' | 'pending' = 'pending';

    if (order_id) {
      const { data: order } = await serviceClient
        .from('orders')
        .select('id, customer_id, vendor_id, items, total, status, payment_status')
        .eq('id', order_id)
        .eq('customer_id', user.id)
        .maybeSingle();

      if (!order || order.status === 'cancelled') {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      const subItem = (order.items as any[] | null)?.find(
        (i) => i?.subscription_type === 'weekly' || i?.subscription_type === 'monthly'
      );
      if (!subItem) {
        return NextResponse.json({ error: 'Order has no subscription plan' }, { status: 400 });
      }

      planType = subItem.subscription_type;
      vendorId = order.vendor_id;
      price = Number(order.total);
      paymentStatus = order.payment_status === 'paid' ? 'paid' : 'pending';
    } else {
      if (!PLAN_TYPES.includes(body?.plan_type) || typeof body?.vendor_id !== 'string') {
        return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
      }
      planType = body.plan_type;
      vendorId = body.vendor_id;
      price = calculateSubscriptionPricing(planType, meal_type, days.length).finalPrice;
    }

    const { data: vendor } = await serviceClient
      .from('vendors')
      .select('id, is_active')
      .eq('id', vendorId)
      .maybeSingle();
    if (!vendor?.is_active) {
      return NextResponse.json({ error: 'This kitchen is not accepting subscriptions' }, { status: 409 });
    }

    const endDate = addDays(start_date, PLAN_LENGTH_DAYS[planType]);
    const deliveries = generateDeliverySchedule(start_date, endDate, days);

    const { data: subscription, error } = await serviceClient
      .from('subscriptions')
      .insert({
        customer_id: user.id,
        vendor_id: vendorId,
        order_id: order_id || null,
        plan_type: planType,
        meal_type,
        start_date,
        end_date: endDate,
        delivery_days: days,
        delivery_time: delivery_time.slice(0, 16),
        address,
        price,
        status: 'active',
        payment_status: paymentStatus,
        auto_renew: auto_renew === true,
        deliveries,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A subscription already exists for this order' }, { status: 409 });
      }
      console.error('Error creating subscription:', error);
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/subscriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select(
        `
        *,
        vendors:vendor_id (
          id,
          business_name,
          cuisine,
          rating
        )
      `
      )
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Error in GET /api/subscriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to generate delivery schedule
function generateDeliverySchedule(
  startDate: string,
  endDate: string,
  deliveryDays: string[]
): any[] {
  const deliveries = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start);

  const dayMap: { [key: string]: number } = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const selectedDayNumbers = deliveryDays.map((day) => dayMap[day.toLowerCase()]);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (selectedDayNumbers.includes(dayOfWeek)) {
      deliveries.push({
        date: current.toISOString().split('T')[0],
        status: 'scheduled',
        order_id: null,
      });
    }
    current.setDate(current.getDate() + 1);
  }

  return deliveries;
}
