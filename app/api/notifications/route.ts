import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notifications });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { type, title, message, target, user_id } = body;

  if (target === 'all') {
    // Broadcast to all users
    const { data: allUsers } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_active', true);

    if (allUsers && allUsers.length > 0) {
      const notifications = allUsers.map((u) => ({
        user_id: u.id,
        type: type || 'system',
        title: title || 'System Message',
        message: message || '',
        is_read: false,
      }));

      const { error } = await createServiceClient().from('notifications').insert(notifications);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, sent: allUsers?.length || 0 });
  }

  // Send to specific user
  const { error } = await createServiceClient().from('notifications').insert([{
    user_id: user_id || user.id,
    type: type || 'system',
    title: title || 'Notification',
    message: message || '',
    is_read: false,
  }]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

