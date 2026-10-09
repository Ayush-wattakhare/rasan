import { createClient } from '@/lib/supabase/server';
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
    const { date: targetDate, reason } = body;

    if (!targetDate) {
      return NextResponse.json({ error: 'Target date is required' }, { status: 400 });
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
        { error: 'Off-days can only be requested on active subscriptions' },
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
        { error: 'This meal has already been delivered and cannot be skipped' },
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
        { error: 'Cannot skip past deliveries' },
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
            }. The home chef has already started cooking fresh ingredients for you.`,
            cutoffPassed: true,
          },
          { status: 400 }
        );
      }
    }

    // Mark current delivery as skipped
    deliveries[deliveryIndex] = {
      ...currentDelivery,
      status: 'skipped',
      skip_reason: reason || 'Customer marked Off-Day',
      skipped_at: new Date().toISOString(),
    };

    // Calculate next available date after the last delivery to extend the subscription
    const dayMap: { [key: string]: number } = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    const deliveryDays: string[] = subscription.delivery_days || [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const allowedDayNumbers = deliveryDays.map((d) => dayMap[d.toLowerCase()]);

    // Find the latest delivery date currently in the array
    const sortedDates = deliveries
      .map((d) => new Date(d.date))
      .sort((a, b) => a.getTime() - b.getTime());

    const lastDate = sortedDates.length > 0 ? new Date(sortedDates[sortedDates.length - 1]) : new Date(subscription.end_date);

    // Find the next allowed working day after lastDate
    const nextExtendedDate = new Date(lastDate);
    let found = false;
    for (let i = 1; i <= 14; i++) {
      nextExtendedDate.setDate(nextExtendedDate.getDate() + 1);
      if (allowedDayNumbers.includes(nextExtendedDate.getDay())) {
        found = true;
        break;
      }
    }

    const nextDateStr = nextExtendedDate.toISOString().split('T')[0];

    // Append the carry-over replacement delivery
    deliveries.push({
      date: nextDateStr,
      status: 'scheduled',
      order_id: null,
      is_extended: true,
      replaced_date: targetDate,
    });

    // Update subscription with extended end date and updated deliveries array
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        deliveries,
        end_date: nextDateStr,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, vendors(id, business_name)')
      .single();

    if (updateError) {
      console.error('Error updating subscription deliveries:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Send notifications to customer
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'system',
      title: 'Off-Day Registered (+1 Day Extended)',
      message: `Your meal delivery for ${targetDate} has been skipped. Your subscription has been extended with a replacement meal on ${nextDateStr}!`,
      data: { subscription_id: id, skipped_date: targetDate, extended_date: nextDateStr },
    });

    // Send notification to vendor if vendor has user_id
    if (subscription.vendors?.user_id) {
      await supabase.from('notifications').insert({
        user_id: subscription.vendors.user_id,
        type: 'order',
        title: 'Customer Off-Day Notice',
        message: `Customer has marked an off-day for ${targetDate}. Do not prepare meal for this subscription on this date.`,
        data: { subscription_id: id, date: targetDate },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Off-day confirmed for ${targetDate}. Subscription extended to ${nextDateStr}!`,
      subscription: updatedSubscription,
      extendedDate: nextDateStr,
    });
  } catch (error: any) {
    console.error('Error in POST /api/subscriptions/[id]/skip-day:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
