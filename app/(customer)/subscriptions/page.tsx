import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SubscriptionsPageClient from '@/components/subscriptions/subscriptions-page-client';

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

  const selectedDayNumbers = (deliveryDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])
    .map((day) => dayMap[day.toLowerCase()] ?? -1)
    .filter((d) => d !== -1);

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
      .select('id, customer_id, vendor_id, items, delivery_address, total, created_at, status')
      .eq('customer_id', user.id)
      .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'ready_for_pickup', 'out_for_delivery', 'delivered'])
      .order('created_at', { ascending: false });

    for (const order of subOrders || []) {
      const subItem: any = (order.items || []).find(
        (i: any) => i.subscription_type === 'weekly' || i.subscription_type === 'monthly'
      );
      if (subItem) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + (subItem.subscription_type === 'weekly' ? 7 : 30));

        const { data: newSub } = await serviceClient
          .from('subscriptions')
          .insert({
            customer_id: user.id,
            vendor_id: order.vendor_id,
            plan_type: subItem.subscription_type,
            meal_type: (subItem.delivery_time || '').toLowerCase().includes('dinner') ? 'dinner' : 'lunch',
            delivery_time: subItem.delivery_time || '12:00 PM',
            delivery_days: subItem.delivery_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            status: 'active',
            price: order.total,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            address: order.delivery_address,
          })
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
        const startDate = sub.start_date || new Date().toISOString().split('T')[0];
        let endDate = sub.end_date;
        if (!endDate || new Date(endDate) < new Date()) {
          const endObj = new Date();
          endObj.setDate(endObj.getDate() + (sub.plan_type === 'weekly' ? 7 : 30));
          endDate = endObj.toISOString().split('T')[0];
        }
        const deliveryDays = sub.delivery_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        const deliveries = generateDeliverySchedule(startDate, endDate, deliveryDays);
        await serviceClient
          .from('subscriptions')
          .update({ deliveries, end_date: endDate, start_date: startDate })
          .eq('id', sub.id);
        sub.deliveries = deliveries;
        sub.end_date = endDate;
        sub.start_date = startDate;
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
