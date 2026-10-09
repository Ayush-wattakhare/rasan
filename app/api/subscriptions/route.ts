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
      vendor_id,
      plan_type,
      meal_type,
      start_date,
      end_date,
      delivery_days,
      delivery_time,
      address,
      price,
      auto_renew,
    } = body;

    // Validate required fields
    if (
      !vendor_id ||
      !plan_type ||
      !meal_type ||
      !start_date ||
      !end_date ||
      !delivery_days ||
      delivery_days.length === 0 ||
      !delivery_time ||
      !address ||
      !price
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate delivery schedule
    const deliveries = generateDeliverySchedule(
      start_date,
      end_date,
      delivery_days
    );

    // Create subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert({
        customer_id: user.id,
        vendor_id,
        plan_type,
        meal_type,
        start_date,
        end_date,
        delivery_days,
        delivery_time,
        address,
        price,
        status: 'active',
        payment_status: 'paid', // In production, integrate with payment gateway
        auto_renew: auto_renew || false,
        deliveries,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/subscriptions:', error);
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

    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select(
        `
        *,
        vendors:vendor_id (
          id,
          business_name,
          cuisine,
          rating
        )
      `
      )
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Error in GET /api/subscriptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to generate delivery schedule
function generateDeliverySchedule(
  startDate: string,
  endDate: string,
  deliveryDays: string[]
): any[] {
  const deliveries = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start);

  const dayMap: { [key: string]: number } = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const selectedDayNumbers = deliveryDays.map((day) => dayMap[day.toLowerCase()]);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (selectedDayNumbers.includes(dayOfWeek)) {
      deliveries.push({
        date: current.toISOString().split('T')[0],
        status: 'scheduled',
        order_id: null,
      });
    }
    current.setDate(current.getDate() + 1);
  }

  return deliveries;
}
