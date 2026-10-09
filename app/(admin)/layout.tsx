import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminBottomNav from '@/components/layout/admin-bottom-nav';
import { PartnerApplicationListener } from '@/components/admin/partner-application-listener';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/login');
  }

  return (
    <div className="relative min-h-screen pb-32">
      <PartnerApplicationListener />
      <main>{children}</main>
      <AdminBottomNav />
    </div>
  );
}
