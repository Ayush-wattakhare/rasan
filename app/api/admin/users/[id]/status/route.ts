import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/guards';
import { isUserRole } from '@/lib/auth/roles';
import { isUuid } from '@/lib/utils/validation-ids';

async function handleUpdate(request: NextRequest, params: Promise<{ id: string }>) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  const { is_active, is_verified, role } = body;

  if (!isUuid(id)) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }
  if ((is_active !== undefined && typeof is_active !== 'boolean') || (is_verified !== undefined && typeof is_verified !== 'boolean')) {
    return NextResponse.json({ error: 'is_active / is_verified must be true or false' }, { status: 400 });
  }
  if (id === auth.user.id && is_active === false) {
    return NextResponse.json({ error: 'You cannot suspend your own account' }, { status: 400 });
  }

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
  const { error } = await serviceClient.from('profiles').update(updateData).eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Suspension also bans the auth user, so every existing session stops
  // working everywhere (pages, all API routes, realtime), not only where the
  // code checks profiles.is_active. Re-activation lifts the ban.
  if (is_active !== undefined) {
    const { error: banError } = await serviceClient.auth.admin.updateUserById(id, {
      ban_duration: is_active ? 'none' : '876000h',
    });
    if (banError) console.error(`Could not ${is_active ? 'unban' : 'ban'} auth user ${id}:`, banError.message);
    if (!is_active) {
      // A suspended rider stops receiving orders immediately.
      await serviceClient.from('delivery_partners').update({ is_online: false }).eq('user_id', id);
    }
  }

  // Also sync verification state with vendor or delivery partner tables
  if (is_verified === false && is_active === false) {
    // Both false indicates a decline or deactivation
    const { data: vRecord } = await serviceClient
      .from('vendors')
      .select('documents')
      .eq('user_id', id)
      .maybeSingle();
    if (vRecord) {
      const existingDocs =
        vRecord?.documents && typeof vRecord.documents === 'object' ? vRecord.documents : {};
      await serviceClient
        .from('vendors')
        .update({
          is_active: false,
          documents: {
            ...existingDocs,
            application_status: 'declined',
            declined_at: new Date().toISOString(),
          },
        })
        .eq('user_id', id);
    }
    const { data: dRecord } = await serviceClient
      .from('delivery_partners')
      .select('documents')
      .eq('user_id', id)
      .maybeSingle();
    if (dRecord) {
      const existingDocs =
        dRecord?.documents && typeof dRecord.documents === 'object' ? dRecord.documents : {};
      await serviceClient
        .from('delivery_partners')
        .update({
          is_verified: false,
          documents: {
            ...existingDocs,
            application_status: 'declined',
            declined_at: new Date().toISOString(),
          },
        })
        .eq('user_id', id);
    }
  } else {
    if (is_active !== undefined) {
      // Re-activating an account re-opens only kitchens that were already
      // approved. Approval itself happens in the partner review
      // (/api/admin/partners/verify), never as a side effect of un-suspending.
      if (is_active) {
        await serviceClient.from('vendors').update({ is_active: true }).eq('user_id', id).eq('is_approved', true);
      } else {
        await serviceClient.from('vendors').update({ is_active: false }).eq('user_id', id);
      }
    }
    if (is_verified !== undefined) {
      await serviceClient.from('delivery_partners').update({ is_verified }).eq('user_id', id);
    }
  }

  // Send partner acceptance notification if verified
  if (is_verified === true) {
    try {
      await serviceClient.from('notifications').insert([
        {
          user_id: id,
          type: 'system',
          title: 'Application Accepted! 🎉',
          message:
            'Congratulations! Your partnership application has been approved by admin. You can now access your partner portal.',
          is_read: false,
        },
      ]);
    } catch {
      // Non-critical notification failure
    }
  }

  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleUpdate(request, params);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleUpdate(request, params);
}
