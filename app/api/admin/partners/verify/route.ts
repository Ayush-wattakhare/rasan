import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/guards';
import { isUuid } from '@/lib/utils/validation-ids';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    const { userId, partnerId, role, action, reason } = body;

    const targetUserId = userId || partnerId;
    if (!targetUserId || !role || !action) {
      return NextResponse.json(
        { error: 'Missing required parameters (userId, role, action)' },
        { status: 400 }
      );
    }
    // Validated before it is used inside a PostgREST .or() filter below.
    if (!isUuid(targetUserId) || (role !== 'vendor' && role !== 'delivery')) {
      return NextResponse.json({ error: 'Invalid user id or role' }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const isAccept = action === 'accept';
    const isBlock = action === 'block';
    const isDecline = action === 'decline';

    if (!isAccept && !isBlock && !isDecline) {
      return NextResponse.json(
        { error: 'Invalid action. Must be accept, decline, or block' },
        { status: 400 }
      );
    }

    // 2. Resolve target partner and update application status in documents
    let actualUserId = targetUserId;

    if (role === 'vendor') {
      const { data: vRecord } = await serviceClient
        .from('vendors')
        .select('id, user_id, documents')
        .or(`id.eq.${targetUserId},user_id.eq.${targetUserId}`)
        .maybeSingle();

      if (vRecord) {
        actualUserId = vRecord.user_id;
        const existingDocs =
          vRecord.documents && typeof vRecord.documents === 'object' ? vRecord.documents : {};
        const updatedDocs = {
          ...existingDocs,
          application_status: isAccept ? 'approved' : isBlock ? 'blocked' : 'declined',
          ...(isDecline
            ? {
                decline_reason: reason || 'Application declined by admin',
                declined_at: new Date().toISOString(),
              }
            : {}),
          ...(isBlock
            ? {
                block_reason: reason || 'Account permanently blocked by admin',
                blocked_at: new Date().toISOString(),
              }
            : {}),
          ...(isAccept ? { approved_at: new Date().toISOString() } : {}),
        };

        const { error: vErr } = await serviceClient
          .from('vendors')
          .update({
            is_active: isAccept,
            // Vendor-level approval (migration 006): independent of the rider role.
            is_approved: isAccept,
            documents: updatedDocs,
            updated_at: new Date().toISOString(),
          })
          .eq('id', vRecord.id);
        if (vErr) {
          console.error('Vendor verify update error:', vErr);
          return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: 'Vendor application not found' }, { status: 404 });
      }
    } else if (role === 'delivery') {
      const { data: dRecord } = await serviceClient
        .from('delivery_partners')
        .select('id, user_id, documents')
        .or(`id.eq.${targetUserId},user_id.eq.${targetUserId}`)
        .maybeSingle();

      if (dRecord) {
        actualUserId = dRecord.user_id;
        const existingDocs =
          dRecord.documents && typeof dRecord.documents === 'object' ? dRecord.documents : {};
        const updatedDocs = {
          ...existingDocs,
          application_status: isAccept ? 'approved' : isBlock ? 'blocked' : 'declined',
          ...(isDecline
            ? {
                decline_reason: reason || 'Application declined by admin',
                declined_at: new Date().toISOString(),
              }
            : {}),
          ...(isBlock
            ? {
                block_reason: reason || 'Account permanently blocked by admin',
                blocked_at: new Date().toISOString(),
              }
            : {}),
          ...(isAccept ? { approved_at: new Date().toISOString() } : {}),
        };

        const { error: dErr } = await serviceClient
          .from('delivery_partners')
          .update({
            is_verified: isAccept,
            is_online: false,
            documents: updatedDocs,
            updated_at: new Date().toISOString(),
          })
          .eq('id', dRecord.id);
        if (dErr) {
          console.error('Delivery verify update error:', dErr);
          return NextResponse.json({ error: 'Failed to update delivery partner' }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: 'Delivery partner application not found' }, { status: 404 });
      }
    }

    // 1. Update Profile verification, active state, and role
    const profileUpdate: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (isAccept) {
      profileUpdate.is_verified = true;
      profileUpdate.is_active = true;
    } else if (isBlock) {
      profileUpdate.is_verified = false;
      profileUpdate.is_active = false; // Completely suspend blocked account
    } else if (isDecline) {
      profileUpdate.is_verified = false;
      // Demote role back to customer so they can still order food without lingering in partner state
      profileUpdate.role = 'customer';
    }

    const { error: profileErr } = await serviceClient
      .from('profiles')
      .update(profileUpdate)
      .eq('id', actualUserId);
    if (profileErr) {
      console.error('Profile verify update error:', profileErr);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    // 3. Dispatch Notification to the Partner (Client)
    try {
      let notificationTitle = '⚠️ Application Update: Action Required';
      let notificationMessage = '';

      if (isAccept) {
        notificationTitle = `🎉 Application Approved: Welcome to Rasan!`;
        notificationMessage = `Congratulations! Your ${role === 'vendor' ? 'Home Kitchen' : 'Delivery Partner'} application has been verified and activated by Rasan Admin. You can now login and start operations.`;
      } else if (isBlock) {
        notificationTitle = `🚫 Account Suspended / Partner Blocked`;
        notificationMessage = `Your ${role === 'vendor' ? 'Home Kitchen' : 'Delivery Partner'} account has been suspended by administration.\nReason: ${reason || 'Violation of partner compliance guidelines'}.\nContact support if you believe this is in error.`;
      } else {
        notificationTitle = `⚠️ Application Update: Action Required`;
        notificationMessage = `Your ${role === 'vendor' ? 'Home Kitchen' : 'Delivery Partner'} registration could not be approved at this time.\nReason: ${reason || 'Incomplete or unverified documentation'}.\nPlease update your information or contact support.`;
      }

      await (serviceClient.from('notifications') as any).insert({
        user_id: actualUserId,
        type: 'system',
        title: notificationTitle,
        message: notificationMessage,
        is_read: false,
      });
    } catch (nErr) {
      console.error('Failed to dispatch user notification:', nErr);
    }

    return NextResponse.json({
      success: true,
      action,
      userId: actualUserId,
      message: isAccept
        ? `Partner successfully approved and activated. Welcome notification sent.`
        : isBlock
          ? `Partner permanently blocked and account deactivated.`
          : `Partner application declined. Reason dispatched to client.`,
    });
  } catch (err: any) {
    console.error('Partner verification error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
