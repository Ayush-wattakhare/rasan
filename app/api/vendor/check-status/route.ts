import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const serviceClient = createServiceClient();

    // Check existing vendor record
    const { data: vendors, error: vendorError } = await serviceClient
      .from('vendors')
      .select('*')
      .eq('user_id', user.id);

    if (vendorError) {
      console.warn('Vendor fetch error:', vendorError);
    }

    let vendor = vendors && vendors.length > 0 ? vendors[0] : null;

    // If no vendor record exists yet, auto-initialize default vendor profile
    if (!vendor) {
      const schedule = { is_open: true, open_time: '08:00', close_time: '22:00' };
      const { data: newVendor, error: createError } = await serviceClient
        .from('vendors')
        .insert({
          user_id: user.id,
          business_name: user.user_metadata?.name || user.user_metadata?.business_name || "Anita's Home Kitchen",
          cuisine: ['North Indian', 'Maharashtrian', 'Thali'],
          address: 'Pimpri Colony, Pimpri-Chinchwad, Pune',
          phone: user.user_metadata?.phone || '+91 98765 43210',
          email: user.email || 'vendor@rasan.com',
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
        })
        .select()
        .single();

      if (!createError && newVendor) {
        vendor = newVendor;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        vendor,
        vendorCount: vendor ? 1 : 0,
        vendorError: null,
      },
    });
  } catch (error) {
    console.error('Error in check-status:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        data: { vendor: null, vendorCount: 0, vendorError: 'Internal server error' },
      },
      { status: 500 }
    );
  }
}
