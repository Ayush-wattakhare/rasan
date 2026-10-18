import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/guards';
import { isUuid } from '@/lib/utils/validation-ids';

const NOTIFICATION_TYPES = ['order', 'delivery', 'payment', 'promotion', 'system'] as const;
const BATCH_SIZE = 500;

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
  }

  return NextResponse.json({ notifications });
}

/** Admin-only: send a notification to one user or to every active user. */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const type = NOTIFICATION_TYPES.includes(body?.type) ? body.type : 'system';
  const title = typeof body?.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 120) : null;
  const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 1000) : '';

  if (!title || !message) {
    return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  if (body?.target === 'all') {
    // Page through recipients and insert in batches, so a large user base
    // doesn't become one huge request.
    let sent = 0;
    for (let from = 0; ; from += BATCH_SIZE) {
      const { data: users, error: usersError } = await serviceClient
        .from('profiles')
        .select('id')
        .eq('is_active', true)
        .order('id')
        .range(from, from + BATCH_SIZE - 1);

      if (usersError) {
        console.error('Broadcast recipient lookup error:', usersError);
        return NextResponse.json({ error: 'Failed to send notifications', sent }, { status: 500 });
      }
      if (!users || users.length === 0) break;

      const { error } = await serviceClient.from('notifications').insert(
        users.map((u) => ({ user_id: u.id, type, title, message, is_read: false }))
      );
      if (error) {
        console.error('Broadcast insert error:', error);
        return NextResponse.json({ error: 'Failed to send notifications', sent }, { status: 500 });
      }
      sent += users.length;
      if (users.length < BATCH_SIZE) break;
    }

    return NextResponse.json({ success: true, sent });
  }

  const targetUserId = body?.user_id ?? auth.user.id;
  if (!isUuid(targetUserId)) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }

  const { data: target } = await serviceClient.from('profiles').select('id').eq('id', targetUserId).maybeSingle();
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const { error } = await serviceClient
    .from('notifications')
    .insert([{ user_id: targetUserId, type, title, message, is_read: false }]);

  if (error) {
    console.error('Notification insert error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
