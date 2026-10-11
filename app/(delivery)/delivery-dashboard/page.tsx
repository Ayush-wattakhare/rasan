import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getRiderFeed } from '@/lib/delivery/rider-feed';
import DeliveryDashboardMain from './delivery-dashboard-main';

export const dynamic = 'force-dynamic';

export default async function DeliveryDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch delivery partner profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'delivery') {
    redirect('/');
  }

  const serviceClient = createServiceClient();

  // Fetch existing partner record safely using limit(1)
  const { data: existingPartners } = await serviceClient
    .from('delivery_partners')
    .select('*')
    .eq('user_id', user.id)
    .limit(1);

  const deliveryPartner = existingPartners?.[0] || null;

  // Riders are created through the application form and verified by an admin.
  if (!deliveryPartner) {
    redirect('/become-delivery-partner');
  }



  const partnerId = deliveryPartner.id;

  const { activeDeliveries, availableOrders } = await getRiderFeed(deliveryPartner);

  const today = new Date().toISOString().split('T')[0];
  const { data: todayDeliveries } = await serviceClient
    .from('orders')
    .select('total, delivery_fee')
    .eq('delivery_partner_id', partnerId)
    .eq('status', 'delivered')
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`);

  const todayEarnings =
    todayDeliveries && todayDeliveries.length > 0
      ? todayDeliveries.reduce((sum, order) => sum + (Number(order.delivery_fee) || 0), 0)
      : 0;

  return (
    <DeliveryDashboardMain
      deliveryPartner={deliveryPartner}
      profile={profile}
      activeDeliveries={activeDeliveries}
      availableOrders={availableOrders}
      todayEarnings={todayEarnings}
    />
  );
}
