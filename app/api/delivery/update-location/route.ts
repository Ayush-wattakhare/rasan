import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';

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

    // Riders only (also blocks suspended accounts).
    const auth = await requireRole('delivery');
    if (!auth.ok) return auth.response;
    const user = auth.user;

    // Update delivery partner location (using PostGIS WKT string: POINT(longitude latitude))
    const { data: updatedRow, error: updateError } = await createServiceClient()
      .from('delivery_partners')
      .update({
        current_location: `POINT(${longitude} ${latitude})` as any,
        updated_at: new Date().toISOString()
      })
      .eq('id', deliveryPartnerId)
      .eq('user_id', user.id) // Ensure user can only update their own location
      .select('id')
      .maybeSingle();

    if (updateError) {
      console.error('Error updating location:', updateError);
      return NextResponse.json(
        { error: 'Failed to update location' },
        { status: 500 }
      );
    }
    if (!updatedRow) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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