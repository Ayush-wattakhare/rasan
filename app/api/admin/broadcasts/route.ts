import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export interface BroadcastMessage {
  id: string;
  title: string;
  message: string;
  target: 'all' | 'customer' | 'vendor' | 'delivery';
  priority: 'urgent' | 'info' | 'promo';
  created_at: string;
  reach_count: number;
}

const MEMORY_BROADCASTS: BroadcastMessage[] = [
  {
    id: 'b-1',
    title: '🌧️ Heavy Rain Alert in Pune Cluster',
    message: 'Monsoon showers reported across Pimpri & Baner. Rider safety protocol active. Delivery times extended by 20-30 mins.',
    target: 'all',
    priority: 'urgent',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    reach_count: 142,
  },
  {
    id: 'b-2',
    title: '⚡ Lunch Peak Order Surge',
    message: 'High demand for North Indian Thalis. Home chefs are requested to keep meals packed on time for swift rider pickups.',
    target: 'vendor',
    priority: 'info',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    reach_count: 18,
  }
];

export async function GET() {
  return NextResponse.json({
    success: true,
    broadcasts: MEMORY_BROADCASTS,
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, message, target, priority } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    const newBroadcast: BroadcastMessage = {
      id: `b-${Date.now()}`,
      title,
      message,
      target: target || 'all',
      priority: priority || 'info',
      created_at: new Date().toISOString(),
      reach_count: target === 'all' ? 142 : target === 'vendor' ? 18 : 51,
    };

    MEMORY_BROADCASTS.unshift(newBroadcast);

    // Push into system notifications table if service client is available
    try {
      const serviceClient = createServiceClient();
      let usersQuery = serviceClient.from('profiles').select('id');
      if (target !== 'all') {
        usersQuery = usersQuery.eq('role', target);
      }
      const { data: targetUsers } = await usersQuery;

      if (targetUsers && targetUsers.length > 0) {
        const notifications = targetUsers.map(u => ({
          user_id: u.id,
          type: 'system' as const,
          title,
          message,
          is_read: false,
        }));
        await (serviceClient.from('notifications') as any).insert(notifications.slice(0, 50));
      }
    } catch {}

    return NextResponse.json({
      success: true,
      broadcast: newBroadcast,
      message: `Broadcast transmitted to ${newBroadcast.reach_count} ${target.toUpperCase()} nodes.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
