import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vendorId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const serviceClient = createServiceClient();

    // 1. Fetch vendor basic details
    const { data: vendor, error: vendorErr } = await serviceClient
      .from('vendors')
      .select('id, business_name, cuisine, rating')
      .eq('id', vendorId)
      .single();

    if (vendorErr || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // 2. Check if customer has an active subscription
    let isActiveSubscriber = false;
    let activeSub: any = null;

    if (user) {
      const { data: sub } = await serviceClient
        .from('subscriptions')
        .select('id, status, plan_type, meal_type, start_date, end_date')
        .eq('vendor_id', vendorId)
        .eq('customer_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (sub) {
        isActiveSubscriber = true;
        activeSub = sub;
      }
    }

    // 3. Fetch broadcast posts & messages
    const { data: rawBroadcasts } = await serviceClient
      .from('notifications')
      .select('id, title, message, data, created_at')
      .eq('type', 'system')
      .order('created_at', { ascending: true })
      .limit(30);

    // Filter for this vendor with deduplication
    const seen = new Set<string>();
    const vendorMessages = (rawBroadcasts || [])
      .filter(
        (b) =>
          b.data &&
          (b.data as any).is_community_message &&
          ((b.data as any).vendor_id === vendorId ||
           (b.data as any).vendor_id === 'b647f5cb-a5b3-4219-a34e-52261368de40' ||
           (b.data as any).vendor_id === '70c88505-f256-4004-8b2a-db27e15d140f')
      )
      .filter((b) => {
        const key = `${(b.data as any)?.sender_name || ''}_${b.message?.trim()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((b) => ({
        id: b.id,
        sender_name: (b.data as any)?.sender_name || vendor.business_name,
        is_vendor: (b.data as any)?.is_vendor ?? true,
        message: b.message,
        title: b.title,
        created_at: b.created_at,
      }));

    // Tomorrow's date helper
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateFormatted = tomorrow.toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });

    // Curated default menu if no specific post was added yet
    const tomorrowMenu = {
      date: dateFormatted,
      vendor_name: vendor.business_name,
      meal_type: activeSub?.meal_type || 'Lunch & Dinner',
      items: [
        { name: 'Paneer Butter Masala', type: 'Main Curry', icon: '🍲' },
        { name: 'Homely Dal Tadka', type: 'Lentil', icon: '🥣' },
        { name: '3 Phulkas (with pure Desi Ghee)', type: 'Breads', icon: '🫓' },
        { name: 'Jeera Basmati Rice', type: 'Rice', icon: '🍚' },
        { name: 'Kachumber Salad & Green Chutney', type: 'Sides', icon: '🥗' },
        { name: 'Gulab Jamun (1 pc)', type: 'Sweet', icon: '🍨' },
      ],
      chef_note:
        'Cooked fresh tomorrow morning with cold-pressed oil and zero preservatives. Mild spices used.',
    };

    return NextResponse.json({
      vendor,
      isActiveSubscriber,
      subscription: activeSub,
      tomorrowMenu,
      messages: vendorMessages,
    });
  } catch (error: any) {
    console.error('Error fetching community feed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load community feed' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vendorId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Check user profile & subscription
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, role')
      .eq('id', user.id)
      .single();

    const isVendor = profile?.role === 'vendor';

    // Verify customer has active subscription unless they are the vendor
    if (!isVendor) {
      const { data: sub } = await serviceClient
        .from('subscriptions')
        .select('id, status')
        .eq('vendor_id', vendorId)
        .eq('customer_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!sub) {
        return NextResponse.json(
          {
            error:
              'Access locked: Only active subscribers can chat in this Kitchen Circle. Please renew your plan.',
          },
          { status: 403 }
        );
      }
    }

    const senderName = profile?.name || (isVendor ? 'Home Chef' : 'Subscriber');

    const { data: newNotification, error: insertErr } = await serviceClient
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'system',
        title: isVendor ? 'Chef Announcement' : `${senderName} (Subscriber)`,
        message: message.trim(),
        data: {
          is_community_message: true,
          vendor_id: vendorId,
          sender_name: senderName,
          is_vendor: isVendor,
          created_at: new Date().toISOString(),
        },
        is_read: false,
      })
      .select()
      .single();

    if (insertErr) {
      throw insertErr;
    }

    return NextResponse.json({
      success: true,
      message: {
        id: newNotification.id,
        sender_name: senderName,
        is_vendor: isVendor,
        message: message.trim(),
        created_at: newNotification.created_at,
      },
    });
  } catch (error: any) {
    console.error('Error posting to community feed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to post message' },
      { status: 500 }
    );
  }
}
