import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SubscriptionsPageClient from '@/components/subscriptions/subscriptions-page-client';
import { datesBetween } from '@/lib/pricing/plan-schedule';
import { createSubscriptionForOrder } from '@/lib/subscriptions/from-order';
import { istToday } from '@/lib/utils/ist-date';
import { getDeliveryLocation } from '@/lib/location/server-location';
import { getServiceArea } from '@/lib/location/nearby';

// order_id is filled when a delivery is turned into an order.
const toDeliveries = (dates: string[]) =>
  dates.map((date) => ({ date, status: 'scheduled' as const }));

export default async function SubscriptionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user subscriptions
  let { data: subscriptions } = await supabase
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

  // Auto-sync: If user has no rows in subscriptions table, check orders with recurring items
  if (!subscriptions || subscriptions.length === 0) {
    const serviceClient = createServiceClient();
    const { data: subOrders } = await serviceClient
      .from('orders')
      .select('id, customer_id, vendor_id, items, delivery_address, total, created_at, status, payment_method, payment_status')
      .eq('customer_id', user.id)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'out_for_delivery', 'delivered'])
      .order('created_at', { ascending: false });

    for (const order of subOrders || []) {
      const subItem: any = (order.items || []).find(
        (i: any) => i.subscription_type === 'weekly' || i.subscription_type === 'monthly'
      );
      // Only orders that are paid or confirmed cash-on-delivery start a plan
      // (same rule as POST /api/subscriptions).
      const isPaid = order.payment_status === 'paid';
      const cashConfirmed = order.payment_method === 'cash' && order.status !== 'pending';
      if (subItem && (isPaid || cashConfirmed)) {
        // Same rules and price as checkout (shared helper); a start date that
        // has passed moves to the next valid day.
        const created = await createSubscriptionForOrder(order as any, {
          address: (order.delivery_address as unknown as Record<string, unknown>) || {},
          rescheduleIfPast: true,
        });
        if (!created.ok) continue;

        const { data: newSub } = await serviceClient
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
          .eq('id', created.subscription.id)
          .single();

        if (newSub) {
          subscriptions = [newSub];
          break;
        }
      }
    }
  }

  // Ensure active subscriptions have generated deliveries schedule
  if (subscriptions && subscriptions.length > 0) {
    const serviceClient = createServiceClient();
    for (const sub of subscriptions) {
      if (sub.status === 'active' && (!sub.deliveries || sub.deliveries.length === 0)) {
        const startDate = sub.start_date;
        const endDate = sub.end_date;
        // Never extend a plan here: an expired plan stays expired.
        if (!startDate || !endDate || endDate < istToday()) continue;
        // Older rows: rebuild the schedule between their own start and end dates.
        const deliveries = toDeliveries(datesBetween(startDate, endDate, sub.delivery_days));
        if (deliveries.length === 0) continue;
        await serviceClient
          .from('subscriptions')
          .update({ deliveries } as any)
          .eq('id', sub.id);
        sub.deliveries = deliveries;
      }
    }
  }

  // Only kitchens that deliver to the customer's saved location can be subscribed to.
  const area = await getServiceArea(supabase, await getDeliveryLocation());
  const vendors =
    area.status === 'available'
      ? [...area.kitchens]
          .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.distance_km - b.distance_km)
          .slice(0, 20)
          .map((k) => ({ id: k.id, business_name: k.business_name, cuisine: k.cuisine, rating: k.rating }))
      : [];

  // Fetch plan pricing
  const { data: planPricing } = await supabase
    .from('plan_pricing')
    .select('*')
    .eq('is_active', true)
    .order('plan_type', { ascending: true });

  return (
    <SubscriptionsPageClient
      subscriptions={subscriptions || []}
      vendors={vendors || []}
      planPricing={planPricing || []}
    />
  );
}
