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

  const vendor = vendors && vendors.length > 0 ? vendors[0] : null;

  // Vendor records are created through the application form and approved by an admin.
  if (!vendor) {
    redirect('/become-vendor');
  }

  return <VendorProfileForm vendor={vendor} />;
}
