import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const serviceSupabase = createServiceClient();

    // Check meals count
    const { data: meals, error: mealsError, count: mealsCount } = await serviceSupabase
      .from('meals')
      .select('*', { count: 'exact' });

    // Check vendors count
    const { data: vendors, error: vendorsError, count: vendorsCount } = await serviceSupabase
      .from('vendors')
      .select('id, business_name, is_active, email, rating', { count: 'exact' });

    // Check profiles count
    const { data: profiles, error: profilesError, count: profilesCount } = await serviceSupabase
      .from('profiles')
      .select('id, email, name, role, is_active', { count: 'exact' });

    return NextResponse.json({
      success: true,
      data: {
        meals: {
          count: mealsCount,
          data: meals,
          error: mealsError
        },
        vendors: {
          count: vendorsCount,
          data: vendors,
          error: vendorsError
        },
        profiles: {
          count: profilesCount,
          data: profiles,
          error: profilesError
        }
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}