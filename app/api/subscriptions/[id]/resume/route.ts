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

    // Verify ownership and current status
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('customer_id, status, end_date')
      .eq('id', id)
      .single();

    if (!subscription || subscription.customer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (subscription.status !== 'paused') {
      return NextResponse.json(
        { error: 'Only paused subscriptions can be resumed' },
        { status: 400 }
      );
    }

    // Check if subscription has expired
    const endDate = new Date(subscription.end_date);
    if (endDate < new Date()) {
      return NextResponse.json(
        { error: 'Subscription has expired' },
        { status: 400 }
      );
    }

    // Update subscription status to active
    const { data: updated, error } = await supabase
      .from('subscriptions')
      .update({ status: 'active' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error resuming subscription:', error);
      return NextResponse.json(
        { error: 'Failed to resume subscription' },
        { status: 500 }
      );
    }

    // Send notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'system',
      title: 'Subscription Resumed',
      message: 'Your subscription has been resumed. Deliveries will continue as scheduled.',
      data: { subscription_id: id },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error in POST /api/subscriptions/[id]/resume:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
