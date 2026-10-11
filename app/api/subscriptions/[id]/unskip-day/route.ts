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
    const { date: targetDate } = body;

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

    const deliveries: any[] = subscription.deliveries || [];
    const deliveryIndex = deliveries.findIndex((d) => d.date === targetDate);

    if (deliveryIndex === -1) {
      return NextResponse.json({ error: 'Delivery date not found' }, { status: 400 });
    }

    if (deliveries[deliveryIndex].status !== 'skipped') {
      return NextResponse.json({ error: 'This date is not marked as skipped' }, { status: 400 });
    }

    // Revert target delivery to scheduled
    deliveries[deliveryIndex] = {
      ...deliveries[deliveryIndex],
      status: 'scheduled',
      skip_reason: null,
      skipped_at: null,
    };

    // Remove the extended replacement delivery that was appended for this date
    const extendedIndex = deliveries.findIndex(
      (d) => d.is_extended && d.replaced_date === targetDate
    );

    if (extendedIndex !== -1) {
      deliveries.splice(extendedIndex, 1);
    }

    // Recalculate end date from the latest delivery remaining
    const sortedDates = deliveries
      .map((d) => new Date(d.date))
      .sort((a, b) => a.getTime() - b.getTime());

    const latestDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1].toISOString().split('T')[0] : subscription.end_date;

    // end_date is not user-writable (migration 003); ownership was checked above.
    const serviceClient = createServiceClient();
    const { data: updatedSubscription, error: updateError } = await serviceClient
      .from('subscriptions')
      .update({
        deliveries,
        end_date: latestDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('customer_id', user.id)
      .select('*, vendors(id, business_name)')
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Delivery resumed for ${targetDate}`,
      subscription: updatedSubscription,
    });
  } catch (error: any) {
    console.error('Error in POST /api/subscriptions/[id]/unskip-day:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
