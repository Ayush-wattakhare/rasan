import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ActiveDeliveryCard from '@/components/delivery/active-delivery-card';

export default async function ActiveDeliveriesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'delivery') {
    redirect('/');
  }

  const { data: deliveryPartner } = await supabase
    .from('delivery_partners')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!deliveryPartner) {
    redirect('/delivery-dashboard');
  }

  // Fetch active deliveries
  const { data: activeDeliveries } = await supabase
    .from('orders')
    .select(
      `
      *,
      vendors:vendor_id (
        id,
        business_name,
        address,
        location
      )
    `
    )
    .eq('delivery_partner_id', deliveryPartner.id)
    .in('status', ['picked_up', 'out_for_delivery'])
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Active Deliveries</h1>

      {!activeDeliveries || activeDeliveries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No active deliveries. Check available orders to get started.
          </p>
          <a
            href="/available-orders"
            className="text-primary hover:underline mt-4 inline-block"
          >
            View Available Orders
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {activeDeliveries.map((order) => (
            <ActiveDeliveryCard
              key={order.id}
              order={order}
              deliveryPartnerId={deliveryPartner.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
