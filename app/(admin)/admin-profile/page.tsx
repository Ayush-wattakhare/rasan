import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminProfileMain from './admin-profile-main';

export const metadata = {
  title: 'Administrator Identity - Nexus Command',
};

export default async function AdminProfilePage() {
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

  if (profile?.role !== 'admin') {
    redirect('/');
  }

  return <AdminProfileMain profile={profile} userEmail={user.email} />;
}
