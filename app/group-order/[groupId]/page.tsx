import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import GroupOrderDetails from '@/components/group-orders/group-order-details';
import { notFound } from 'next/navigation';

export default async function PublicGroupOrderPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const supabase = await createClient();
  const { groupId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/group-order/${groupId}`);
  }

  // Fetch group order
  const { data: groupOrder, error } = await supabase
    .from('group_orders')
    .select(
      `
      *,
      vendors:vendor_id (
        id,
        business_name,
        cuisine,
        rating,
        address
      )
    `
    )
    .eq('group_id', groupId)
    .single();

  if (error || !groupOrder) {
    notFound();
  }

  // Check if order has expired
  const expiresAt = new Date(groupOrder.expires_at);
  const isExpired = expiresAt < new Date();

  // Fetch vendor meals
  const { data: meals } = await supabase
    .from('meals')
    .select('*')
    .eq('vendor_id', groupOrder.vendor_id)
    .eq('is_available', true)
    .order('name', { ascending: true });

  return (
    <div className="container mx-auto p-6">
      <GroupOrderDetails
        groupOrder={groupOrder}
        meals={meals || []}
        currentUserId={user.id}
        isExpired={isExpired}
      />
    </div>
  );
}
