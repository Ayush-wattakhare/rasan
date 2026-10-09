import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const serviceSupabase = createServiceClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has delivery role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email, name')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'delivery') {
      return NextResponse.json(
        { error: 'User must have delivery role' },
        { status: 400 }
      );
    }

    // Check if delivery partner record already exists
    const { data: existingPartner } = await supabase
      .from('delivery_partners')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingPartner) {
      return NextResponse.json(
        { error: 'Delivery partner record already exists' },
        { status: 409 }
      );
    }

    // Create delivery partner record using service client
    const { data: deliveryPartner, error: createError } = await serviceSupabase
      .from('delivery_partners')
      .insert([{
        user_id: user.id,
        vehicle_type: 'bike',
        vehicle_number: 'MH12AB1234',
        license_number: 'DL1234567890',
        is_online: false,
        rating: 4.5,
        total_deliveries: 25,
        earnings: {
          today: 150,
          this_week: 850,
          this_month: 3200,
          total: 15000,
        },
        is_verified: true,
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating delivery partner:', createError);
      return NextResponse.json(
        { error: `Failed to create delivery partner: ${createError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery partner record created successfully',
      deliveryPartner,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}