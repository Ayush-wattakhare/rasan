import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import OperatorProfileMain from './operator-profile-main';

export const metadata = {
  title: 'Operator Profile - Rasan',
};

export default async function OperatorProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch base profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'delivery') {
    redirect('/');
  }

  // Fetch delivery partner context
  const { data: deliveryPartner } = await supabase
    .from('delivery_partners')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!deliveryPartner) {
    redirect('/delivery-dashboard');
  }

  return (
    <OperatorProfileMain 
      profile={profile}
      deliveryPartner={deliveryPartner}
    />
  );
}
