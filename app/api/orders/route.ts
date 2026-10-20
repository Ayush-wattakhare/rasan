import { NextRequest, NextResponse } from 'next/server';
import { HANDOVER_EMBED } from '@/lib/utils/delivery-otp';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/guards';
import { WEEKDAYS, calculateCartTotals, getItemPricing } from '@/lib/pricing/order-pricing';
import { createHandoverCode } from '@/lib/utils/delivery-otp-server';
import { haversineDistanceKm, MAX_DELIVERY_RADIUS_KM } from '@/lib/utils/constants';
import { coordsFromAddress, parseVendorLocation } from '@/lib/utils/geo';
import { defaultPlanStart, isValidPlanStart, planMealCount } from '@/lib/pricing/plan-schedule';
import { releaseOrderStock, reserveOrderStock, sweepUnpaidOrders } from '@/lib/orders/stock';
import { createSubscriptionForOrder, orderHasPlan } from '@/lib/subscriptions/from-order';
import { sanitizeDeliveryAddress } from '@/lib/utils/address';
import { onlinePaymentsConfigured } from '@/lib/payments/razorpay-client';
import type { PaymentMethod, SubscriptionType } from '@/types';

const PAYMENT_METHODS: readonly PaymentMethod[] = ['cash', 'card', 'upi', 'wallet'];
const SUBSCRIPTION_TYPES: readonly SubscriptionType[] = ['one-time', 'weekly', 'monthly'];
const MAX_ITEMS = 50;
const MAX_QUANTITY = 50;

type RequestedItem = {
  meal_id: string;
  quantity: number;
  subscription_type: SubscriptionType;
  delivery_days: string[];
  delivery_time: string;
  /** First delivery date of a weekly / monthly plan (YYYY-MM-DD, IST). */
  plan_start_date?: string;
};

function parseItems(raw: unknown): RequestedItem[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_ITEMS) return null;
  const items: RequestedItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') return null;
    const item = entry as Record<string, unknown>;
    const quantity = Number(item.quantity);
    const subscriptionType = (item.subscription_type ?? 'one-time') as SubscriptionType;
    const deliveryDays = Array.isArray(item.delivery_days) ? item.delivery_days : [];

    if (typeof item.meal_id !== 'string' || !item.meal_id) return null;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) return null;
    if (!SUBSCRIPTION_TYPES.includes(subscriptionType)) return null;
    if (!deliveryDays.every((d) => (WEEKDAYS as readonly string[]).includes(String(d)))) return null;

    const days = Array.from(new Set(deliveryDays.map(String)));
    let planStart: string | undefined;
    if (subscriptionType !== 'one-time') {
      planStart = item.plan_start_date == null ? defaultPlanStart() : (item.plan_start_date as string);
      if (!isValidPlanStart(planStart)) return null;
      // A plan must deliver at least one meal (price follows the meal count).
      if (planMealCount(subscriptionType, planStart, days) === 0) return null;
    }

    items.push({
      meal_id: item.meal_id,
      quantity,
      subscription_type: subscriptionType,
      delivery_days: days,
      delivery_time: typeof item.delivery_time === 'string' ? item.delivery_time.slice(0, 32) : '',
      ...(planStart ? { plan_start_date: planStart } : {}),
    });
  }
  return items;
}

/**
 * Creates an order. Prices, totals and statuses are computed here from the
 * database; the browser only sends what it wants (meals, quantities, plan,
 * address, payment method).
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const items = parseItems(body?.items);
    const paymentMethod = body?.payment_method as PaymentMethod;
    const deliveryAddress = body?.delivery_address;

    if (!items) {
      return NextResponse.json({ error: 'Invalid order items' }, { status: 400 });
    }
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }
    // Don't create an online order that can never be paid (orphan pending order).
    if (paymentMethod !== 'cash' && !onlinePaymentsConfigured()) {
      return NextResponse.json(
        { error: 'Online payment is not available right now. Please choose Cash on Delivery.', code: 'PAYMENTS_UNAVAILABLE' },
        { status: 503 }
      );
    }
    // Clear abandoned checkouts (gives their stock back) before taking a new order.
    await sweepUnpaidOrders();
    if (!deliveryAddress || typeof deliveryAddress !== 'object' || Array.isArray(deliveryAddress)) {
      return NextResponse.json({ error: 'Delivery address is required' }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const mealIds = Array.from(new Set(items.map((i) => i.meal_id)));
    const { data: meals, error: mealsError } = await serviceClient
      .from('meals')
      .select('id, name, price, vendor_id, is_available, stock')
      .in('id', mealIds);

    if (mealsError) {
      console.error('Meal lookup error:', mealsError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    const mealsById = new Map((meals || []).map((m) => [m.id, m]));
    const unavailable: string[] = [];
    for (const item of items) {
      const meal = mealsById.get(item.meal_id);
      if (!meal || !meal.is_available || (meal.stock !== null && meal.stock < item.quantity)) {
        unavailable.push(meal?.name || item.meal_id);
      }
    }
    if (unavailable.length > 0) {
      return NextResponse.json(
        { error: 'Some items are no longer available', unavailableItems: unavailable },
        { status: 409 }
      );
    }

    const vendorIds = new Set((meals || []).map((m) => m.vendor_id));
    const vendorId = (meals || [])[0]?.vendor_id;
    if (vendorIds.size !== 1 || !vendorId) {
      return NextResponse.json(
        { error: 'All items must be from the same kitchen' },
        { status: 400 }
      );
    }

    const { data: vendor } = await serviceClient
      .from('vendors')
      .select('id, is_active, location')
      .eq('id', vendorId)
      .maybeSingle();
    if (!vendor?.is_active) {
      return NextResponse.json({ error: 'This kitchen is not accepting orders' }, { status: 409 });
    }

    // 🌡️ Server-side Freshness Guard — enforce MAX_DELIVERY_RADIUS_KM
    // Runs even if the browser client is bypassed or manipulated.
    // vendor.location arrives as hex EWKB from Supabase (also WKT/GeoJSON); parse it.
    const customerCoords = coordsFromAddress(deliveryAddress);
    if (customerCoords && vendor.location) {
      try {
        // Kitchens that haven't pinned a real location (placeholder) skip the check.
        const vendorCoords = parseVendorLocation(vendor.location);
        if (vendorCoords) {
          const distKm = haversineDistanceKm(
            customerCoords.lat,
            customerCoords.lng,
            vendorCoords.lat,
            vendorCoords.lng
          );
          if (distKm > MAX_DELIVERY_RADIUS_KM) {
            return NextResponse.json(
              {
                error: `Delivery address is too far (${distKm.toFixed(1)} km). This kitchen only delivers within ${MAX_DELIVERY_RADIUS_KM} km to ensure your meal arrives fresh and hot.`,
                code: 'DELIVERY_TOO_FAR',
                distanceKm: Math.round(distKm * 10) / 10,
                maxKm: MAX_DELIVERY_RADIUS_KM,
              },
              { status: 400 }
            );
          }
        }
      } catch (distErr) {
        // Non-critical — log and continue; do not block the order
        console.warn('[FreshnessGuard] Server distance check failed:', distErr);
      }
    }

    const pricedItems = items.map((item) => {
      const meal = mealsById.get(item.meal_id)!;
      const pricing = getItemPricing({ ...item, price: Number(meal.price) });
      return {
        meal_id: meal.id,
        name: meal.name,
        quantity: item.quantity,
        price: Number(meal.price),
        subscription_type: item.subscription_type,
        delivery_days: item.delivery_days,
        delivery_time: item.delivery_time,
        discount_percentage: pricing.discountPct,
        // Stored so the subscription created from this order schedules exactly
        // the meals that were paid for.
        ...(item.plan_start_date
          ? { plan_start_date: item.plan_start_date, meal_count: pricing.mealCount }
          : {}),
      };
    });
    const totals = calculateCartTotals(pricedItems);
    const isCash = paymentMethod === 'cash';

    const { data: order, error } = await serviceClient
      .from('orders')
      .insert({
        customer_id: auth.user.id,
        vendor_id: vendorId,
        items: pricedItems as any,
        subtotal: totals.subtotal,
        delivery_fee: totals.delivery_fee,
        tax: totals.platform_fee,
        discount: 0,
        total: totals.total,
        payment_method: paymentMethod,
        // Cash orders go straight to the kitchen; online orders wait for payment verification.
        status: isCash ? 'confirmed' : 'pending',
        payment_status: 'pending',
        delivery_address: deliveryAddress as any,
        delivery_instructions:
          typeof body.delivery_instructions === 'string'
            ? body.delivery_instructions.slice(0, 500)
            : null,
      })
      .select()
      .single();

    if (error || !order) {
      console.error('Order creation error:', error);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    const discardOrder = async () => {
      await releaseOrderStock(order.id);
      await serviceClient.from('orders').delete().eq('id', order.id);
    };

    // Handover PIN, readable only by this customer (order_handover_codes).
    if (!(await createHandoverCode(order.id))) {
      await discardOrder();
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Take the quantities out of stock now, atomically (two customers can't both
    // buy the last portion). Released if the order is cancelled or expires.
    const reserved = await reserveOrderStock(order.id);
    if (!reserved.ok) {
      await discardOrder();
      const soldOut = reserved.outOfStockMealId ? mealsById.get(reserved.outOfStockMealId)?.name : null;
      return NextResponse.json(
        { error: 'Some items are no longer available', unavailableItems: soldOut ? [soldOut] : [] },
        { status: 409 }
      );
    }

    // A weekly / monthly plan is created here, with the order, so it exists even
    // if the browser closes after paying. It starts once the order is paid.
    let subscription: unknown = null;
    if (orderHasPlan(pricedItems)) {
      const planAddress = sanitizeDeliveryAddress(deliveryAddress);
      const result = planAddress
        ? await createSubscriptionForOrder(order as any, { address: planAddress })
        : ({ ok: false, status: 400, error: 'A valid delivery address is required for a plan' } as const);
      if (!result.ok) {
        await discardOrder();
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      subscription = result.subscription;
    }

    return NextResponse.json({ ...order, subscription }, { status: 201 });
  } catch (error) {
    console.error('Order API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20') || 20, 1), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0);

    // Build query
    let query = supabase
      .from('orders')
      .select(`*, ${HANDOVER_EMBED}`)
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && ['pending', 'confirmed', 'preparing', 'ready', 'ready_for_pickup', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'].includes(status)) {
      const dbStatus = status === 'ready_for_pickup' ? 'ready' : status;
      query = query.eq('status', dbStatus as any);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Orders fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
