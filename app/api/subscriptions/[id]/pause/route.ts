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

    // Verify ownership and current status
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('customer_id, status')
      .eq('id', id)
      .single();

    if (!subscription || subscription.customer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active subscriptions can be paused' },
        { status: 400 }
      );
    }

    // Update subscription status to paused
    const { data: updated, error } = await supabase
      .from('subscriptions')
      .update({ status: 'paused' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error pausing subscription:', error);
      return NextResponse.json(
        { error: 'Failed to pause subscription' },
        { status: 500 }
      );
    }

    // Send notification
    await createServiceClient().from('notifications').insert({
      user_id: user.id,
      type: 'system',
      title: 'Subscription Paused',
      message: 'Your subscription has been paused. You can resume it anytime.',
      data: { subscription_id: id },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error in POST /api/subscriptions/[id]/pause:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
