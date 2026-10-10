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

  const { data: deliveryPartner } = await serviceClient
    .from('delivery_partners')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // Riders are created through the application form and verified by an admin.
  if (!deliveryPartner) {
    redirect('/become-delivery-partner');
  }

  // Fetch orders ready for delivery pickup
  const { data: readyOrders } = deliveryPartner.is_verified
    ? await serviceClient
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
    .eq('status', 'ready')
    .is('delivery_partner_id', null)
    .order('created_at', { ascending: false })
    .limit(20)
    : { data: [] as any[] };

  // Never ship the customer's handover PIN to the rider's browser.
  const availableOrders = (readyOrders || [])
    .filter((o: any) => o.payment_method === 'cash' || o.payment_status === 'paid')
    .map((o: any) => {
      const { delivery_otp: _otp, ...address } = (o.delivery_address || {}) as any;
      return { ...o, delivery_address: address };
    });

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-3xl font-black text-gray-900 uppercase italic tracking-tight mb-6">
        Available Orders for Pickup
      </h1>

      {!deliveryPartner.is_verified && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
            Your rider account is awaiting admin verification. Orders will appear here once approved.
          </p>
        </div>
      )}

      {deliveryPartner && !deliveryPartner.is_online && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
            You are currently offline. Switch online on the dashboard to accept orders.
          </p>
        </div>
      )}

      <AvailableOrdersList
        orders={availableOrders}
        deliveryPartnerId={deliveryPartner?.id || ''}
        isOnline={deliveryPartner?.is_online ?? true}
        currentLocation={deliveryPartner?.current_location}
      />
    </div>
  );
}
