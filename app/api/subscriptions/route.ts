import { createClient, createServiceClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/guards';
import {
  PLAN_TYPES,
  SUBSCRIPTION_MEAL_TYPES,
  calculateSubscriptionPricing,
  type PlanType,
} from '@/lib/pricing/subscription-pricing';
import {
  isValidPlanStart,
  normalizeDeliveryDays,
  planDates,
  planEndDate,
} from '@/lib/pricing/plan-schedule';
import { sanitizeDeliveryAddress } from '@/lib/utils/address';
import { coordsFromAddress } from '@/lib/utils/geo';
import { deliveryRange } from '@/lib/location/delivery-range';
import { getDeliveryLocation } from '@/lib/location/server-location';
import { MAX_DELIVERY_RADIUS_KM } from '@/lib/utils/constants';
import { createSubscriptionForOrder } from '@/lib/subscriptions/from-order';
import { NextResponse } from 'next/server';

function buildDeliveries(dates: string[]) {
  return dates.map((date) => ({ date, status: 'scheduled', order_id: null }));
}

/**
 * Creates a subscription. Schedule, price, payment status and status are
 * decided here, never taken from the request.
 *
 * - From checkout (`order_id`): start date, delivery days and time come from
 *   the order item that was paid for, and the scheduled meal count must match
 *   what the order charged. Active once the order is paid (or confirmed COD).
 * - Standalone: priced from the plan table by the number of scheduled meals;
 *   it waits in 'pending_payment' until paid.
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  try {
    const body = await request.json().catch(() => ({}));
    const { order_id, auto_renew } = body ?? {};

    const address = sanitizeDeliveryAddress(body?.address);
    if (!address) {
      return NextResponse.json({ error: 'A valid delivery address is required' }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    let planType: PlanType;
    let vendorId: string;
    let price: number;
    let startDate: string;
    let days: string[];
    let deliveryTime: string;
    let mealType: string;
    // Standalone plans wait for payment.
    const paymentStatus = 'pending' as const;
    const status = 'pending_payment' as const;

    if (order_id) {
      // Plans bought at checkout are created by POST /api/orders; this path is
      // kept for older clients and is idempotent (returns the existing plan).
      const { data: order } = await serviceClient
        .from('orders')
        .select('id, customer_id, vendor_id, items, status, payment_status, payment_method')
        .eq('id', order_id)
        .eq('customer_id', user.id)
        .maybeSingle();
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      const result = await createSubscriptionForOrder(order as any, {
        address,
        autoRenew: auto_renew === true,
      });
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json(result.subscription, { status: result.created ? 201 : 200 });
    }

    {
      if (!PLAN_TYPES.includes(body?.plan_type) || typeof body?.vendor_id !== 'string') {
        return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
      }
      if (!(SUBSCRIPTION_MEAL_TYPES as readonly string[]).includes(body?.meal_type)) {
        return NextResponse.json({ error: 'Invalid meal type' }, { status: 400 });
      }
      if (!isValidPlanStart(body?.start_date)) {
        return NextResponse.json(
          { error: 'Start date must be between tomorrow and 30 days from today' },
          { status: 400 }
        );
      }
      if (typeof body?.delivery_time !== 'string' || !body.delivery_time) {
        return NextResponse.json({ error: 'Delivery time is required' }, { status: 400 });
      }
      planType = body.plan_type;
      vendorId = body.vendor_id;
      mealType = body.meal_type;
      startDate = body.start_date;
      days = normalizeDeliveryDays(body?.delivery_days);
      deliveryTime = body.delivery_time.slice(0, 16);
      price = calculateSubscriptionPricing(planType, mealType, days, startDate).finalPrice;
    }

    const dates = planDates(planType, startDate, days);
    if (dates.length === 0) {
      return NextResponse.json(
        { error: 'No deliveries fall in this plan. Choose other delivery days or another start date.' },
        { status: 400 }
      );
    }

    const { data: vendor } = await serviceClient
      .from('vendors')
      .select('id, is_active, location')
      .eq('id', vendorId)
      .maybeSingle();
    if (!vendor?.is_active) {
      return NextResponse.json({ error: 'This kitchen is not accepting subscriptions' }, { status: 409 });
    }

    // Same 10 km rule as checkout. Plans from an order were checked when it was placed.
    if (!order_id) {
      const customer = coordsFromAddress(address) || (await getDeliveryLocation());
      const range = deliveryRange(customer, vendor.location);
      if (range.status === 'out-of-range') {
        return NextResponse.json(
          {
            error: `This kitchen is ${range.distanceKm.toFixed(1)} km away and only delivers within ${MAX_DELIVERY_RADIUS_KM} km.`,
            code: 'DELIVERY_TOO_FAR',
          },
          { status: 400 }
        );
      }
    }

    const { data: subscription, error } = await serviceClient
      .from('subscriptions')
      .insert({
        customer_id: user.id,
        vendor_id: vendorId,
        order_id: order_id || null,
        plan_type: planType,
        meal_type: mealType,
        start_date: startDate,
        end_date: planEndDate(planType, startDate),
        delivery_days: days,
        delivery_time: deliveryTime,
        address,
        price,
        status,
        payment_status: paymentStatus,
        auto_renew: auto_renew === true,
        deliveries: buildDeliveries(dates),
      } as any)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A subscription already exists for this order' }, { status: 409 });
      }
      console.error('Error creating subscription:', error);
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/subscriptions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
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
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Error in GET /api/subscriptions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
