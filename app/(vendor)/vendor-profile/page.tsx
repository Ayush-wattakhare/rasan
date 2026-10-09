import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import VendorProfileForm from '@/components/vendor/vendor-profile-form';

export const metadata = {
  title: 'Edit Profile | Rasan Vendor',
  description: 'Edit your vendor profile, business hours, and contact information',
};

export default async function VendorProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const serviceClient = createServiceClient();
  const { data: vendors } = await serviceClient
    .from('vendors')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  let vendor = vendors && vendors.length > 0 ? vendors[0] : null;

  if (!vendor) {
    const defaultHours: any = {
      monday: { open_time: '09:00', close_time: '21:00', is_open: true },
      tuesday: { open_time: '09:00', close_time: '21:00', is_open: true },
      wednesday: { open_time: '09:00', close_time: '21:00', is_open: true },
      thursday: { open_time: '09:00', close_time: '21:00', is_open: true },
      friday: { open_time: '09:00', close_time: '21:00', is_open: true },
      saturday: { open_time: '09:00', close_time: '21:00', is_open: true },
      sunday: { open_time: '09:00', close_time: '21:00', is_open: true },
    };

    const { data: newVendor } = await serviceClient
      .from('vendors')
      .insert({
        user_id: user.id,
        business_name: user.user_metadata?.name || 'Home Kitchen',
        cuisine: ['Indian'],
        address: 'Pune, Maharashtra',
        phone: user.user_metadata?.phone || '',
        email: user.email || '',
        location: 'POINT(73.8567 18.5204)' as any,
        operating_hours: defaultHours,
        is_active: true,
        rating: 5.0,
        total_orders: 0,
      } as any)
      .select()
      .single();
    vendor = newVendor;
  }

  return <VendorProfileForm vendor={vendor} />;
}
