import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

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
    const { vendor_id, expires_at } = body;

    if (!vendor_id || !expires_at) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique group ID
    const group_id = randomBytes(8).toString('hex');

    // Create group order
    const { data: groupOrder, error } = await supabase
      .from('group_orders')
      .insert({
        group_id,
        host_id: user.id,
        vendor_id,
        participants: [],
        status: 'open',
        expires_at,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating group order:', error);
      return NextResponse.json(
        { error: 'Failed to create group order' },
        { status: 500 }
      );
    }

    return NextResponse.json(groupOrder, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/group-orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
