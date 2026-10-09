import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check if meals table exists and has data
    const { data: meals, error: mealsError, count } = await supabase
      .from('meals')
      .select('*', { count: 'exact' })
      .limit(5);

    // Check vendors
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, business_name, user_id')
      .limit(5);

    // Try the join query
    const { data: mealsWithVendors, error: joinError } = await supabase
      .from('meals')
      .select('*, vendors(id, business_name, rating)')
      .eq('is_available', true)
      .limit(5);

    return NextResponse.json({
      meals: {
        count,
        data: meals,
        error: mealsError,
      },
      vendors: {
        data: vendors,
        error: vendorsError,
      },
      mealsWithVendors: {
        data: mealsWithVendors,
        error: joinError,
      },
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { error: 'Failed to debug', details: error },
      { status: 500 }
    );
  }
}
