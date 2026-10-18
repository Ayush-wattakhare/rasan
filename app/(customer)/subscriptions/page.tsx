import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SubscriptionsPageClient from '@/components/subscriptions/subscriptions-page-client';
import {
  datesBetween,
  defaultPlanStart,
  isValidPlanStart,
  normalizeDeliveryDays,
  planDates,
  planEndDate,
  type SchedulablePlan,
} from '@/lib/pricing/plan-schedule';
import { istToday } from '@/lib/utils/ist-date';

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
        const plan = subItem.subscription_type as SchedulablePlan;
        // The plan that was paid for: its start date (if still ahead) and its days.
        const startDate = isValidPlanStart(subItem.plan_start_date) ? subItem.plan_start_date : defaultPlanStart();
        const days = normalizeDeliveryDays(subItem.delivery_days);
        const dates = planDates(plan, startDate, days);
        if (dates.length === 0) continue;

        const { data: newSub } = await serviceClient
          .from('subscriptions')
          .insert({
            customer_id: user.id,
            vendor_id: order.vendor_id,
            plan_type: plan,
            meal_type: (subItem.delivery_time || '').toLowerCase().includes('dinner') ? 'dinner' : 'lunch',
            delivery_time: subItem.delivery_time || '12:30 PM',
            delivery_days: days,
            status: 'active',
            order_id: order.id,
            payment_status: isPaid ? 'paid' : 'pending',
            price: order.total,
            start_date: startDate,
            end_date: planEndDate(plan, startDate),
            address: order.delivery_address,
            deliveries: toDeliveries(dates),
          } as any)
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

  // Fetch available verified proper vendors for creating subscriptions
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, business_name, cuisine, rating')
    .eq('is_active', true)
    .not('business_name', 'ilike', '%test%')
    .order('rating', { ascending: false })
    .limit(20);

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
