import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const DEFAULT_OPERATING_HOURS = {
  monday: { is_open: true, open_time: '08:00', close_time: '21:00' },
  tuesday: { is_open: true, open_time: '08:00', close_time: '21:00' },
  wednesday: { is_open: true, open_time: '08:00', close_time: '21:00' },
  thursday: { is_open: true, open_time: '08:00', close_time: '21:00' },
  friday: { is_open: true, open_time: '08:00', close_time: '21:00' },
  saturday: { is_open: true, open_time: '09:00', close_time: '22:00' },
  sunday: { is_open: false, open_time: '09:00', close_time: '20:00' },
};

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', user.id)
      .single();

    // Check if vendor already exists
    const { data: existingVendors } = await supabase
      .from('vendors')
      .select('*')
      .eq('user_id', user.id);

    if (existingVendors && existingVendors.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Vendor record already exists',
        vendor: existingVendors[0],
      });
    }

    // Create vendor with correct schema columns
    const { data: newVendor, error: insertError } = await supabase
      .from('vendors')
      .insert([
        {
          user_id: user.id,
          business_name: profile?.name || user.user_metadata?.name || 'Home Kitchen',
          description: 'Authentic homemade food prepared with love and hygiene.',
          cuisine: ['North Indian', 'Home Style'],
          location: 'POINT(72.8777 19.0760)' as any,
          address: 'Mumbai, Maharashtra, India',
          phone: user.phone || '9999999999',
          email: profile?.email || user.email || '',
          operating_hours: DEFAULT_OPERATING_HOURS,
          rating: 4.5,
          total_orders: 0,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message, details: insertError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Vendor record created successfully',
      vendor: newVendor,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
