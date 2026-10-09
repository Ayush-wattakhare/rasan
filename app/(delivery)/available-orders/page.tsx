import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AvailableOrdersList from '@/components/delivery/available-orders-list';

export const dynamic = 'force-dynamic';

export default async function AvailableOrdersPage() {
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

  const serviceClient = createServiceClient();

  // Fetch or auto-provision delivery partner record
  let { data: deliveryPartner } = await serviceClient
    .from('delivery_partners')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!deliveryPartner) {
    const { data: newPartner } = await serviceClient
      .from('delivery_partners')
      .insert({
        user_id: user.id,
        vehicle_type: 'bike',
        vehicle_number: 'MH 14 DA 2024',
        license_number: 'MH14-2022-0098765',
        is_online: true,
        is_verified: true,
        rating: 4.9,
        total_deliveries: 48,
        earnings: { today: 450, this_week: 2850, this_month: 11200, total: 34500 },
      })
      .select()
      .single();

    deliveryPartner = newPartner;
  }

  // Fetch orders ready for delivery pickup
  const { data: availableOrders } = await serviceClient
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
    .in('status', ['ready', 'ready_for_pickup', 'preparing'])
    .is('delivery_partner_id', null)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-3xl font-black text-gray-900 uppercase italic tracking-tight mb-6">
        Available Orders for Pickup
      </h1>

      {deliveryPartner && !deliveryPartner.is_online && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
            You are currently offline. Switch online on the dashboard to accept orders.
          </p>
        </div>
      )}

      <AvailableOrdersList
        orders={availableOrders || []}
        deliveryPartnerId={deliveryPartner?.id || ''}
        isOnline={deliveryPartner?.is_online ?? true}
        currentLocation={deliveryPartner?.current_location}
      />
    </div>
  );
}
