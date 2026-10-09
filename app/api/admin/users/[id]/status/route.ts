import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

async function handleUpdate(request: NextRequest, params: Promise<{ id: string }>) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { is_active, is_verified, role } = body;

  const updateData: any = {};
  if (is_active !== undefined) updateData.is_active = is_active;
  if (is_verified !== undefined) updateData.is_verified = is_verified;
  if (role !== undefined) updateData.role = role;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  // Use service role client to bypass RLS
  const serviceClient = createServiceClient();
  const { error } = await serviceClient
    .from('profiles')
    .update(updateData)
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also sync verification state with vendor or delivery partner tables
  // vendors table has is_active; delivery_partners table has is_verified
  if (is_active !== undefined) {
    await serviceClient.from('vendors').update({ is_active }).eq('user_id', id);
  }

  if (is_verified !== undefined) {
    await serviceClient.from('delivery_partners').update({ is_verified }).eq('user_id', id);
  }

  // Send partner acceptance notification if verified
  if (is_verified === true) {
    try {
      await serviceClient.from('notifications').insert([{
        user_id: id,
        type: 'system',
        title: 'Application Accepted! 🎉',
        message: 'Congratulations! Your partnership application has been approved by admin. You can now access your partner portal.',
        is_read: false,
      }]);
    } catch {
      // Non-critical notification failure
    }
  }

  return NextResponse.json({ success: true });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(request, params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(request, params);
}

