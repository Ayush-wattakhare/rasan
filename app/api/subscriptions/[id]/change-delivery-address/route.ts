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
    const { date: targetDate, address } = body;

    if (!targetDate || !address || !address.street) {
      return NextResponse.json(
        { error: 'Target date and complete address are required' },
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

    const deliveries: any[] = subscription.deliveries || [];
    const deliveryIndex = deliveries.findIndex((d) => d.date === targetDate);

    if (deliveryIndex === -1) {
      return NextResponse.json({ error: 'Delivery date not found' }, { status: 400 });
    }

    if (deliveries[deliveryIndex].status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Can only update address on scheduled upcoming deliveries' },
        { status: 400 }
      );
    }

    // Update delivery address override for this specific date
    deliveries[deliveryIndex] = {
      ...deliveries[deliveryIndex],
      address_override: address,
      address_updated_at: new Date().toISOString(),
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
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Send notification
    await createServiceClient().from('notifications').insert({
      user_id: user.id,
      type: 'system',
      title: 'Delivery Address Updated for Single Day',
      message: `Your meal delivery for ${targetDate} has been redirected to: ${address.street}, ${address.city || ''}`,
      data: { subscription_id: id, date: targetDate, address },
    });

    return NextResponse.json({
      success: true,
      message: `Address updated for delivery on ${targetDate}`,
      subscription: updatedSubscription,
    });
  } catch (error: any) {
    console.error('Error in POST /api/subscriptions/[id]/change-delivery-address:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
