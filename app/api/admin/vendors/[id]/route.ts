import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function DELETE(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await props.params;

  if (!id) {
    return NextResponse.json({ error: 'Missing vendor ID' }, { status: 400 });
  }

  try {
    const serviceClient = createServiceClient();

    // Find vendor by id or user_id
    const { data: vendor, error: findError } = await serviceClient
      .from('vendors')
      .select('id, user_id, business_name')
      .or(`id.eq.${id},user_id.eq.${id}`)
      .maybeSingle();

    if (findError || !vendor) {
      return NextResponse.json({ error: 'Vendor not found in registry' }, { status: 404 });
    }

    // 1. Delete vendor record (cascades to meals, subscriptions, reviews, payouts)
    const { error: deleteError } = await serviceClient.from('vendors').delete().eq('id', vendor.id);

    if (deleteError) {
      console.error('Failed to delete vendor:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // 2. Reset user's role to 'customer' in profiles
    await serviceClient
      .from('profiles')
      .update({
        role: 'customer',
        updated_at: new Date().toISOString(),
      })
      .eq('id', vendor.user_id);

    // 3. Dispatch system notification to the user
    try {
      await (serviceClient.from('notifications') as any).insert({
        user_id: vendor.user_id,
        type: 'system',
        title: 'Vendor Storefront Removed',
        message: `Your vendor storefront "${vendor.business_name}" has been removed by platform administration. You can continue using Rasan as a customer.`,
        is_read: false,
      });
    } catch (nErr) {
      console.error('Notification dispatch note:', nErr);
    }

    return NextResponse.json({
      success: true,
      message: `Vendor "${vendor.business_name}" was successfully deleted from registry.`,
    });
  } catch (err: any) {
    console.error('Delete vendor error:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete vendor' }, { status: 500 });
  }
}
