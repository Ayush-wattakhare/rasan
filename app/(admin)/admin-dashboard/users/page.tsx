import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import UserManagement from './user-management';

export default async function AdminUsersPage() {
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

  if (!profile || profile.role !== 'admin') {
    redirect('/login');
  }

  // Fetch all users
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch vendors
  const { data: vendors } = await supabase
    .from('vendors')
    .select(`
      *,
      profiles (
        id,
        name,
        email,
        phone,
        role,
        is_active,
        created_at
      )
    `)
    .order('created_at', { ascending: false });

  // Fetch delivery partners
  const { data: deliveryPartners } = await supabase
    .from('delivery_partners')
    .select(`
      *,
      profiles (
        id,
        name,
        email,
        phone,
        role,
        is_active,
        created_at
      )
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">
          Manage vendors, delivery partners, and customers
        </p>
      </div>

      <UserManagement 
        users={users || []}
        vendors={vendors || []}
        deliveryPartners={deliveryPartners || []}
      />
    </div>
  );
}