import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deliveryPartnerId, latitude, longitude } = body;

    if (!deliveryPartnerId || typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Delivery partner ID, latitude, and longitude are required' },
        { status: 400 }
      );
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify the user is authenticated and is the delivery partner
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update delivery partner location (using PostGIS WKT string: POINT(longitude latitude))
    const { error: updateError } = await supabase
      .from('delivery_partners')
      .update({ 
        current_location: `POINT(${longitude} ${latitude})` as any,
        updated_at: new Date().toISOString()
      })
      .eq('id', deliveryPartnerId)
      .eq('user_id', user.id); // Ensure user can only update their own location

    if (updateError) {
      console.error('Error updating location:', updateError);
      return NextResponse.json(
        { error: 'Failed to update location' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Location updated successfully',
      location: { lat: latitude, lng: longitude },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}