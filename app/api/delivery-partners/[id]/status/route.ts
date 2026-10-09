import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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
    const { is_online } = body;

    if (typeof is_online !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid is_online value' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: deliveryPartner } = await supabase
      .from('delivery_partners')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!deliveryPartner || deliveryPartner.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update online status
    const { data: updated, error } = await supabase
      .from('delivery_partners')
      .update({ is_online })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating delivery partner status:', error);
      return NextResponse.json(
        { error: 'Failed to update status' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error in PUT /api/delivery-partners/[id]/status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
