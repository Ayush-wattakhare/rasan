import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function DELETE(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await props.params;

  if (!id) {
    return NextResponse.json({ error: 'Missing delivery partner ID' }, { status: 400 });
  }

  try {
    const serviceClient = createServiceClient();

    // Find delivery partner by id or user_id
    const { data: partner, error: findError } = await serviceClient
      .from('delivery_partners')
      .select('id, user_id, vehicle_number')
      .or(`id.eq.${id},user_id.eq.${id}`)
      .maybeSingle();

    if (findError || !partner) {
      return NextResponse.json(
        { error: 'Delivery partner not found in registry' },
        { status: 404 }
      );
    }

    // 1. Delete delivery partner record (orders.delivery_partner_id sets null)
    const { error: deleteError } = await serviceClient
      .from('delivery_partners')
      .delete()
      .eq('id', partner.id);

    if (deleteError) {
      console.error('Failed to delete delivery partner:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // 2. Reset user's role to 'customer' in profiles
    await serviceClient
      .from('profiles')
      .update({
        role: 'customer',
        updated_at: new Date().toISOString(),
      })
      .eq('id', partner.user_id);

    // 3. Dispatch system notification to the user
    try {
      await (serviceClient.from('notifications') as any).insert({
        user_id: partner.user_id,
        type: 'system',
        title: 'Delivery Partner Profile Removed',
        message:
          'Your delivery rider profile has been removed by platform administration. You can continue using Rasan as a customer.',
        is_read: false,
      });
    } catch (nErr) {
      console.error('Notification dispatch note:', nErr);
    }

    return NextResponse.json({
      success: true,
      message: `Delivery rider (${partner.vehicle_number || partner.id.slice(0, 8)}) was successfully deleted from registry.`,
    });
  } catch (err: any) {
    console.error('Delete delivery partner error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete delivery partner' },
      { status: 500 }
    );
  }
}
