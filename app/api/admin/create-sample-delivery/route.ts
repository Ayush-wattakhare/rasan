import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const serviceSupabase = createServiceClient();

    // Check if sample delivery partner already exists
    const { data: existingDelivery } = await serviceSupabase
      .from('delivery_partners')
      .select('id')
      .limit(1);

    if (existingDelivery && existingDelivery.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Sample delivery partner already exists',
        credentials: {
          email: 'delivery@rasan.com',
          password: 'delivery123'
        }
      });
    }

    // Create sample delivery partner user
    const { data: deliveryAuthData, error: deliveryAuthError } = await serviceSupabase.auth.admin.createUser({
      email: 'delivery@rasan.com',
      password: 'delivery123',
      email_confirm: true,
      user_metadata: {
        name: 'Sample Delivery Partner',
        role: 'delivery',
      },
    });

    if (deliveryAuthError || !deliveryAuthData.user) {
      return NextResponse.json(
        { error: 'Failed to create sample delivery partner user' },
        { status: 500 }
      );
    }

    // Create delivery partner profile
    await serviceSupabase
      .from('profiles')
      .insert({
        id: deliveryAuthData.user.id,
        email: 'delivery@rasan.com',
        name: 'Sample Delivery Partner',
        phone: '+919876543210',
        role: 'delivery',
        is_active: true,
        is_verified: true,
      });

    // Create delivery partner record
    const { error: deliveryError } = await serviceSupabase
      .from('delivery_partners')
      .insert([{
        user_id: deliveryAuthData.user.id,
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
      }]);

    if (deliveryError) {
      console.error('Delivery partner creation error:', deliveryError);
      return NextResponse.json(
        { error: `Failed to create delivery partner: ${deliveryError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sample delivery partner created successfully',
      credentials: {
        email: 'delivery@rasan.com',
        password: 'delivery123'
      },
      instructions: [
        '1. Logout from current account',
        '2. Login with delivery@rasan.com / delivery123',
        '3. Visit /delivery-dashboard to see the full dashboard'
      ]
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}