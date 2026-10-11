import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/guards';
import { isUserRole } from '@/lib/auth/roles';

async function handleUpdate(request: NextRequest, params: Promise<{ id: string }>) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const body = await request.json();
  const { is_active, is_verified, role } = body;

  const updateData: any = {};
  if (is_active !== undefined) updateData.is_active = is_active;
  if (is_verified !== undefined) updateData.is_verified = is_verified;
  if (role !== undefined) {
    if (!isUserRole(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    if (id === auth.user.id && role !== 'admin') {
      return NextResponse.json({ error: 'You cannot remove your own admin role' }, { status: 400 });
    }
    updateData.role = role;
  }

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

