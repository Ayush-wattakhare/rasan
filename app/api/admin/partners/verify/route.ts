import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, partnerId, role, action, reason } = body;

    const targetUserId = userId || partnerId;
    if (!targetUserId || !role || !action) {
      return NextResponse.json({ error: 'Missing required parameters (userId, role, action)' }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const isAccept = action === 'accept';

    // 1. Update Profile verification & active state
    await serviceClient
      .from('profiles')
      .update({
        is_verified: isAccept,
        is_active: isAccept,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetUserId);

    // 2. Update Vendor or Delivery Partner specific table
    if (role === 'vendor') {
      await serviceClient
        .from('vendors')
        .update({
          is_active: isAccept,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', targetUserId);
    } else if (role === 'delivery') {
      await serviceClient
        .from('delivery_partners')
        .update({
          is_verified: isAccept,
          is_online: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', targetUserId);
    }

    // 3. Dispatch Notification to the Partner (Client)
    try {
      const notificationTitle = isAccept
        ? `🎉 Application Approved: Welcome to Rasan!`
        : `⚠️ Application Update: Action Required`;

      const notificationMessage = isAccept
        ? `Congratulations! Your ${role === 'vendor' ? 'Home Kitchen' : 'Delivery Partner'} application has been verified and activated by Rasan Admin. You can now login and start operations.`
        : `Your ${role === 'vendor' ? 'Home Kitchen' : 'Delivery Partner'} registration could not be approved at this time.\nReason: ${reason || 'Incomplete or unverified documentation'}.\nPlease update your information or contact support.`;

      await (serviceClient.from('notifications') as any).insert({
        user_id: targetUserId,
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
      userId: targetUserId,
      message: isAccept
        ? `Partner successfully approved and activated. Welcome notification sent.`
        : `Partner application declined. Reason dispatched to client.`,
    });
  } catch (err: any) {
    console.error('Partner verification error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
