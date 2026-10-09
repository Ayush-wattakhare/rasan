import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deliveryPartnerId, isOnline } = body;

    if (!deliveryPartnerId || typeof isOnline !== 'boolean') {
      return NextResponse.json(
        { error: 'Delivery partner ID and online status are required' },
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

    // Update delivery partner online status
    const { error: updateError } = await supabase
      .from('delivery_partners')
      .update({ 
        is_online: isOnline,
        updated_at: new Date().toISOString()
      })
      .eq('id', deliveryPartnerId)
      .eq('user_id', user.id); // Ensure user can only update their own status

    if (updateError) {
      console.error('Error updating online status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update online status' },
        { status: 500 }
      );
    }

    // Log the status change for debugging
    console.log(`Delivery partner ${deliveryPartnerId} status changed to ${isOnline ? 'online' : 'offline'}`);

    return NextResponse.json({
      success: true,
      message: `Status updated to ${isOnline ? 'online' : 'offline'}`,
      isOnline,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}