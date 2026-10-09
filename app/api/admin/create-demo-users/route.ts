import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { setupSecretGuard } from '@/lib/dev-tools';

const DEMO_USERS = [
  {
    email: 'customer@rasan.com',
    password: 'customer123',
    name: 'Demo Customer (Pimpri)',
    role: 'customer',
  },
  {
    email: 'vendor@rasan.com',
    password: 'vendor123',
    name: 'Master Chef Anita',
    role: 'vendor',
    business_name: "Anita's Home Kitchen",
    cuisine: ['North Indian', 'Maharashtrian', 'Thali'],
  },
  {
    email: 'delivery@rasan.com',
    password: 'delivery123',
    name: 'Rohan Sharma (Delivery)',
    role: 'delivery',
  },
  {
    email: 'admin@rasan.com',
    password: 'admin123',
    name: 'Platform Administrator',
    role: 'admin',
  },
];

// Local/dev bootstrap only: requires ENABLE_DEV_TOOLS and ADMIN_SETUP_SECRET.
export async function POST(request: Request) {
  const blocked = setupSecretGuard(request);
  if (blocked) return blocked;

  try {
    const supabase = createServiceClient();
    const results = [];

    // Fetch existing auth users
    const { data: authList } = await supabase.auth.admin.listUsers();
    const existingUsers = authList?.users || [];

    for (const demo of DEMO_USERS) {
      let userId: string;
      const existingAuthUser = existingUsers.find((u) => u.email?.toLowerCase() === demo.email.toLowerCase());

      if (existingAuthUser) {
        userId = existingAuthUser.id;
        // Update password and confirm email to ensure valid login
        await supabase.auth.admin.updateUserById(userId, {
          password: demo.password,
          email_confirm: true,
          user_metadata: { name: demo.name, role: demo.role },
        });
      } else {
        // Create fresh auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: demo.email,
          password: demo.password,
          email_confirm: true,
          user_metadata: { name: demo.name, role: demo.role },
        });

        if (authError || !authData.user) {
          results.push({ email: demo.email, status: 'error', error: authError?.message });
          continue;
        }
        userId = authData.user.id;
      }

      // Upsert profile
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: userId,
          email: demo.email,
          name: demo.name,
          role: demo.role as 'customer' | 'vendor' | 'delivery' | 'admin',
          is_active: true,
          is_verified: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (profileError) {
        console.warn(`Profile upsert error for ${demo.email}:`, profileError);
      }

      // If vendor role, ensure vendor record exists
      if (demo.role === 'vendor') {
        const { data: existingVendor } = await supabase
          .from('vendors')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (!existingVendor) {
          const schedule = { is_open: true, open_time: '08:00', close_time: '22:00' };
          await supabase.from('vendors').insert({
            user_id: userId,
            business_name: demo.business_name || "Anita's Home Kitchen",
            cuisine: demo.cuisine || ['North Indian', 'Maharashtrian'],
            address: 'Pimpri Colony, Pimpri-Chinchwad, Pune',
            phone: '+91 98765 43210',
            email: demo.email,
            location: 'POINT(73.8009 18.6279)' as any,
            operating_hours: {
              monday: schedule,
              tuesday: schedule,
              wednesday: schedule,
              thursday: schedule,
              friday: schedule,
              saturday: schedule,
              sunday: schedule,
            },
            is_active: true,
            rating: 4.9,
            total_orders: 142,
          });
        }
      }

      // If delivery role, ensure delivery partner record exists
      if (demo.role === 'delivery') {
        const { data: existingDelivery } = await supabase
          .from('delivery_partners')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (!existingDelivery) {
          await supabase.from('delivery_partners').insert({
            user_id: userId,
            vehicle_type: 'bike',
            vehicle_number: 'MH14AB1234',
            license_number: 'DL-MH14-2024-0012',
            is_online: true,
            is_verified: true,
            rating: 4.8,
            total_deliveries: 45,
            earnings: { today: 450, this_week: 2800, this_month: 11200, total: 24500 },
          });
        }
      }

      results.push({
        email: demo.email,
        password: demo.password,
        role: demo.role,
        status: 'ready',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Demo accounts synchronized and ready for login.',
      accounts: results,
    });
  } catch (error) {
    console.error('Error creating demo users:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
