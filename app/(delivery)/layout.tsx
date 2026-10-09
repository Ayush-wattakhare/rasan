import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DeliveryBottomNav from '@/components/layout/delivery-bottom-nav';

export default async function DeliveryLayout({
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

  if (!profile || profile.role !== 'delivery') {
    redirect('/login');
  }

  return (
    <div className="relative min-h-screen">
      <main>{children}</main>
      <DeliveryBottomNav />
    </div>
  );
}
