import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { date: targetDate, mealTitle, dietaryNotes } = body;

    if (!targetDate || !mealTitle) {
      return NextResponse.json(
        { error: 'Target date and meal choice are required' },
        { status: 400 }
      );
    }

    // Fetch subscription
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*, vendors(id, business_name, user_id)')
      .eq('id', id)
      .single();

    if (fetchError || !subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    if (subscription.customer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'Meals can only be swapped on active subscriptions' },
        { status: 400 }
      );
    }

    const deliveries: any[] = subscription.deliveries || [];
    const deliveryIndex = deliveries.findIndex((d) => d.date === targetDate);

    if (deliveryIndex === -1) {
      return NextResponse.json(
        { error: 'No scheduled delivery found on this date' },
        { status: 400 }
      );
    }

    const currentDelivery = deliveries[deliveryIndex];
    if (currentDelivery.status === 'delivered') {
      return NextResponse.json(
        { error: 'This meal has already been delivered and cannot be swapped' },
        { status: 400 }
      );
    }

    if (currentDelivery.status === 'skipped') {
      return NextResponse.json(
        { error: 'This date is marked as an Off-Day. Resume delivery first to customize meals.' },
        { status: 400 }
      );
    }

    // Enforce Cutoff Times for Same-Day & Past Deliveries (IST Asia/Kolkata)
    const now = new Date();
    const istDateString = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);

    const istHour = parseInt(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        hour12: false,
      }).format(now)
    );

    if (targetDate < istDateString) {
      return NextResponse.json(
        { error: 'Cannot customize past deliveries' },
        { status: 400 }
      );
    }

    if (targetDate === istDateString) {
      const deliveryTime = (subscription.delivery_time || '').toLowerCase();
      const mealType = (subscription.meal_type || '').toLowerCase();
      const isDinner =
        mealType.includes('dinner') ||
        (deliveryTime.includes('pm') &&
          parseInt(deliveryTime) >= 6 &&
          parseInt(deliveryTime) <= 11);

      // Cutoffs: Lunch is 8:00 AM IST, Dinner is 3:00 PM (15:00) IST
      const cutoffHour = isDinner ? 15 : 8;
      const cutoffLabel = isDinner ? '3:00 PM' : '8:00 AM';

      if (istHour >= cutoffHour) {
        return NextResponse.json(
          {
            error: `Same-day cutoff (${cutoffLabel}) has passed for today's ${
              isDinner ? 'dinner' : 'lunch'
            }. The home chef is already preparing today's batch.`,
            cutoffPassed: true,
          },
          { status: 400 }
        );
      }
    }

    // Update meal override on this delivery
    deliveries[deliveryIndex] = {
      ...currentDelivery,
      meal_override: {
        meal_title: mealTitle,
        dietary_notes: dietaryNotes || '',
        updated_at: new Date().toISOString(),
      },
    };

    const { data: updatedSubscription, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        deliveries,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, vendors(id, business_name)')
      .single();

    if (updateError) {
      console.error('Error updating meal customization:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Notify customer
    await createServiceClient().from('notifications').insert({
      user_id: user.id,
      type: 'system',
      title: 'Meal Preference Updated',
      message: `Your meal for ${targetDate} has been customized to "${mealTitle}".`,
      data: { subscription_id: id, date: targetDate, meal_title: mealTitle },
    });

    // Notify home chef if vendor has user_id
    if (subscription.vendors?.user_id) {
      await createServiceClient().from('notifications').insert({
        user_id: subscription.vendors.user_id,
        type: 'order',
        title: 'Tiffin Customization Request',
        message: `Customer selected "${mealTitle}" for ${targetDate}.${
          dietaryNotes ? ` Special Note: ${dietaryNotes}` : ''
        }`,
        data: { subscription_id: id, date: targetDate, meal_title: mealTitle },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Meal updated to "${mealTitle}" for ${targetDate}`,
      subscription: updatedSubscription,
    });
  } catch (error: any) {
    console.error('Error in POST /api/subscriptions/[id]/swap-meal:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
