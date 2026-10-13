import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export default async function CustomerLayout({
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
    .maybeSingle();

  // If the user belongs to another portal (vendor, delivery, admin), route them properly
  if (profile && profile.role !== 'customer') {
    const roleRoutes: Record<string, string> = {
      vendor: '/vendor-dashboard',
      delivery: '/delivery-dashboard',
      admin: '/admin-dashboard',
    };
    redirect(roleRoutes[profile.role] || '/login');
  }

  // If user is authenticated but profile row is missing, self-heal immediately
  if (!profile) {
    try {
      const serviceClient = createServiceClient();
      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'Customer';

      const avatarUrl =
        user.user_metadata?.avatar_url ||
        user.user_metadata?.picture ||
        null;

      await serviceClient.from('profiles').upsert(
        {
          id: user.id,
          email: user.email || '',
          name: fullName,
          role: 'customer',
          is_active: true,
          is_verified: true,
          avatar_url: avatarUrl,
        },
        { onConflict: 'id' }
      );
    } catch (err) {
      console.error('CustomerLayout self-healing profile error:', err);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="flex-1 pb-24 md:pb-32">{children}</div>
    </div>
  );
}
