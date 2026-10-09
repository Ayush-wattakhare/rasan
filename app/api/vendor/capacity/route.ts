import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    const { data: vendor, error } = await serviceClient
      .from('vendors')
      .select('id, business_name, operating_hours, is_active')
      .eq('user_id', user.id)
      .single();

    if (error || !vendor) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    const opHours: any = vendor.operating_hours || {};
    const dailyCapacity = Number(opHours.daily_capacity) || 25;
    const isSoldOut = Boolean(opHours.is_sold_out);

    // Calculate portions booked today from active orders
    const today = new Date().toISOString().split('T')[0];
    const { data: todayOrders } = await serviceClient
      .from('orders')
      .select('items, status, created_at')
      .eq('vendor_id', vendor.id)
      .gte('created_at', `${today}T00:00:00.000Z`);

    let bookedPortions = 0;
    if (todayOrders) {
      for (const ord of todayOrders) {
        if (ord.status !== 'cancelled' && Array.isArray(ord.items)) {
          for (const item of ord.items) {
            bookedPortions += Number(item.quantity) || 1;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        dailyCapacity,
        isSoldOut,
        bookedPortions,
        remainingPortions: Math.max(0, dailyCapacity - bookedPortions),
        isAtCapacity: bookedPortions >= dailyCapacity,
        isActive: vendor.is_active,
      },
    });
  } catch (error: any) {
    console.error('Error fetching vendor capacity:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dailyCapacity, isSoldOut } = body;

    const serviceClient = createServiceClient();
    const { data: vendor, error: fetchError } = await serviceClient
      .from('vendors')
      .select('id, operating_hours')
      .eq('user_id', user.id)
      .single();

    if (fetchError || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const currentHours: any = vendor.operating_hours || {};
    const updatedHours = {
      ...currentHours,
      ...(dailyCapacity !== undefined ? { daily_capacity: Number(dailyCapacity) } : {}),
      ...(isSoldOut !== undefined ? { is_sold_out: Boolean(isSoldOut) } : {}),
    };

    const { error: updateError } = await serviceClient
      .from('vendors')
      .update({ operating_hours: updatedHours })
      .eq('id', vendor.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Capacity updated successfully',
      data: {
        dailyCapacity: updatedHours.daily_capacity || 25,
        isSoldOut: Boolean(updatedHours.is_sold_out),
      },
    });
  } catch (error: any) {
    console.error('Error updating vendor capacity:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
