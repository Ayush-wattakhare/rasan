import { createClient } from '@/lib/supabase/server';
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

    const { data: groupOrder, error } = await supabase
      .from('group_orders')
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
      .single();

    if (error) {
      console.error('Error fetching group order:', error);
      return NextResponse.json(
        { error: 'Group order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(groupOrder);
  } catch (error) {
    console.error('Error in GET /api/group-orders/[id]:', error);
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
    const body = await request.json();
    const { items, contribution } = body;

    if (!items || items.length === 0 || !contribution) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch current group order
    const { data: groupOrder } = await supabase
      .from('group_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (!groupOrder) {
      return NextResponse.json(
        { error: 'Group order not found' },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(groupOrder.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Group order has expired' },
        { status: 400 }
      );
    }

    if (groupOrder.status !== 'open') {
      return NextResponse.json(
        { error: 'Group order is not open' },
        { status: 400 }
      );
    }

    // Add or update participant
    const participants = groupOrder.participants || [];
    const existingIndex = participants.findIndex(
      (p: any) => p.user_id === user.id
    );

    const newParticipant = {
      user_id: user.id,
      items,
      contribution,
    };

    if (existingIndex >= 0) {
      participants[existingIndex] = newParticipant;
    } else {
      participants.push(newParticipant);
    }

    // Update group order
    const { data: updated, error } = await supabase
      .from('group_orders')
      .update({ participants })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating group order:', error);
      return NextResponse.json(
        { error: 'Failed to update group order' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error in PUT /api/group-orders/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
