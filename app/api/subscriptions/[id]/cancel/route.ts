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

    // Verify ownership
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('customer_id, status, payment_status')
      .eq('id', id)
      .single();

    if (!subscription || subscription.customer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (subscription.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Subscription is already cancelled' },
        { status: 400 }
      );
    }

    // Update subscription status to cancelled
    const { data: updated, error } = await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error cancelling subscription:', error);
      return NextResponse.json(
        { error: 'Failed to cancel subscription' },
        { status: 500 }
      );
    }

    // Send notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'system',
      title: 'Subscription Cancelled',
      message: 'Your subscription has been cancelled. No further deliveries will be made.',
      data: { subscription_id: id },
    });

    // In production, process refund if applicable
    // This would integrate with payment gateway

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error in POST /api/subscriptions/[id]/cancel:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
