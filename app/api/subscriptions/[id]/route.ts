import { createClient, createServiceClient } from '@/lib/supabase/server';
import { sanitizeDeliveryAddress } from '@/lib/utils/address';
import { NextResponse } from 'next/server';

export async function GET(
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

    const { data: subscription, error } = await supabase
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
      .eq('id', id)
      .eq('customer_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Error in GET /api/subscriptions/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const body = await request.json().catch(() => ({}));

    // Verify ownership
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('customer_id, status')
      .eq('id', id)
      .single();

    if (!existing || existing.customer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (existing.status === 'cancelled' || existing.status === 'completed') {
      return NextResponse.json({ error: 'This subscription can no longer be changed' }, { status: 400 });
    }

    // Only schedule preferences are editable here. Status changes use the
    // dedicated pause/resume/cancel routes; price, dates and payment never change.
    const updates: Record<string, unknown> = {};
    if (typeof body?.delivery_time === 'string' && body.delivery_time) {
      updates.delivery_time = body.delivery_time.slice(0, 16);
    }
    if (typeof body?.auto_renew === 'boolean') {
      updates.auto_renew = body.auto_renew;
    }
    if (body?.address !== undefined) {
      const address = sanitizeDeliveryAddress(body.address);
      if (!address) {
        return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
      }
      updates.address = address;
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 });
    }

    // Customers have no direct write access (migration 006); ownership checked above.
    const { data: subscription, error } = await createServiceClient()
      .from('subscriptions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('customer_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating subscription:', error);
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Error in PUT /api/subscriptions/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
