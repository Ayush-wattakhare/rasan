import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      vehicle_type,
      vehicle_number,
      license_number,
      documents,
      bank_details,
    } = body;

    // Validate required fields
    if (!vehicle_type || !vehicle_number || !license_number) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create delivery partner record
    const { data: deliveryPartner, error } = await supabase
      .from('delivery_partners')
      .insert({
        user_id: user.id,
        vehicle_type,
        vehicle_number,
        license_number,
        documents,
        bank_details,
        is_online: false,
        is_verified: false,
        rating: 0,
        total_deliveries: 0,
        earnings: {
          today: 0,
          this_week: 0,
          this_month: 0,
          total: 0,
        },
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating delivery partner:', error);
      return NextResponse.json(
        { error: 'Failed to create delivery partner' },
        { status: 500 }
      );
    }

    return NextResponse.json(deliveryPartner, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/delivery-partners:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: deliveryPartner, error } = await supabase
      .from('delivery_partners')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching delivery partner:', error);
      return NextResponse.json(
        { error: 'Delivery partner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(deliveryPartner);
  } catch (error) {
    console.error('Error in GET /api/delivery-partners:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
