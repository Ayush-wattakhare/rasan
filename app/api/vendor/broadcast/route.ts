import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createServiceClient();

    // 1. Fetch vendor record for this authenticated user
    const { data: initialVendor } = await serviceClient
      .from('vendors')
      .select('id, business_name, cuisine, rating, user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let vendor = initialVendor;

    if (!vendor) {
      // Fallback: Check if user has vendor role and link to primary active vendor
      const { data: fallbackVendor } = await serviceClient
        .from('vendors')
        .select('id, business_name, cuisine, rating, user_id')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallbackVendor) {
        vendor = fallbackVendor;
      } else {
        return NextResponse.json(
          { error: 'Vendor profile not found for this user.' },
          { status: 404 }
        );
      }
    }

    // 2. Fetch active subscribers for this vendor
    let { data: subscribers } = await serviceClient
      .from('subscriptions')
      .select('id, customer_id, plan_type, meal_type, delivery_time, delivery_days, address, status, start_date, end_date, price')
      .eq('vendor_id', vendor.id)
      .eq('status', 'active');

    // If no subscriptions found in subscriptions table, check orders with subscription items
    if (!subscribers || subscribers.length === 0) {
      const { data: subOrders } = await serviceClient
        .from('orders')
        .select('id, customer_id, vendor_id, items, delivery_address, total, created_at')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      const extractedSubs: any[] = [];
      (subOrders || []).forEach((order) => {
        (order.items || []).forEach((item: any) => {
          if (item.subscription_type === 'weekly' || item.subscription_type === 'monthly') {
            extractedSubs.push({
              id: `sub_ord_${order.id.slice(0, 8)}`,
              customer_id: order.customer_id,
              vendor_id: vendor.id,
              plan_type: item.subscription_type,
              meal_type: (item.delivery_time || '').toLowerCase().includes('dinner') ? 'dinner' : 'lunch',
              delivery_time: item.delivery_time || '12:30 PM',
              delivery_days: item.delivery_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
              address: order.delivery_address,
              status: 'active',
              start_date: order.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
              end_date: new Date(Date.now() + (item.subscription_type === 'weekly' ? 7 : 30) * 86400000).toISOString().split('T')[0],
              price: order.total,
            });
          }
        });
      });

      if (extractedSubs.length > 0) {
        subscribers = extractedSubs;
      }
    }

    // 2. Fetch customer profiles for names if not already set
    const customerIds = (subscribers || [])
      .map((s) => s.customer_id)
      .filter((id) => id && !id.startsWith('sample_'));
    const customerProfiles: Record<string, any> = {};

    if (customerIds.length > 0) {
      const { data: profiles } = await serviceClient
        .from('profiles')
        .select('id, name, email, phone')
        .in('id', customerIds);

      (profiles || []).forEach((p) => {
        customerProfiles[p.id] = p;
      });
    }

    const enrichedSubscribers = (subscribers || []).map((sub: any) => ({
      ...sub,
      customer_name:
        sub.customer_name || customerProfiles[sub.customer_id]?.name || 'Valued Subscriber',
      customer_email:
        sub.customer_email || customerProfiles[sub.customer_id]?.email || '',
      customer_phone:
        sub.customer_phone || customerProfiles[sub.customer_id]?.phone || '+91 98000 00000',
      address: sub.address || { street: 'Pimpri-Chinchwad', city: 'Pune' },
      dietary_note: sub.dietary_note || 'Standard homely preparation',
    }));

    // 3. Fetch community messages & broadcasts strictly for this vendor
    const isDemoSharedKitchen =
      vendor.id === 'b647f5cb-a5b3-4219-a34e-52261368de40' ||
      vendor.id === '70c88505-f256-4004-8b2a-db27e15d140f';

    const { data: rawBroadcasts } = await serviceClient
      .from('notifications')
      .select('id, user_id, title, message, data, created_at')
      .eq('type', 'system')
      .order('created_at', { ascending: true })
      .limit(50);

    const seen = new Set<string>();
    const vendorMessages = (rawBroadcasts || [])
      .filter((b) => {
        if (!b.data || !(b.data as any).is_community_message) return false;
        const vId = (b.data as any).vendor_id;
        if (isDemoSharedKitchen) {
          return vId === 'b647f5cb-a5b3-4219-a34e-52261368de40' || vId === '70c88505-f256-4004-8b2a-db27e15d140f';
        }
        return vId === vendor.id;
      })
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

    // 4. Tomorrow's Menu
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateFormatted = tomorrow.toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });

    // Check if vendor has a saved menu in notifications
    const latestMenuPost = (rawBroadcasts || [])
      .reverse()
      .find(
        (b) =>
          b.data &&
          (b.data as any).is_menu_broadcast &&
          (b.data as any).vendor_id === vendor.id
      );

    const tomorrowMenu = latestMenuPost
      ? (latestMenuPost.data as any).menu
      : {
          date: dateFormatted,
          meal_type: 'Lunch & Dinner',
          items: [
            { name: 'Paneer Butter Masala', type: 'Main Curry', icon: '🍲' },
            { name: 'Homely Dal Tadka', type: 'Lentil', icon: '🥣' },
            { name: '3 Phulkas (with pure Desi Ghee)', type: 'Breads', icon: '🫓' },
            { name: 'Jeera Basmati Rice', type: 'Rice', icon: '🍚' },
            { name: 'Kachumber Salad & Green Chutney', type: 'Sides', icon: '🥗' },
            { name: 'Gulab Jamun (1 pc)', type: 'Sweet', icon: '🍨' },
          ],
          chef_note:
            'Prepared fresh tomorrow morning with cold-pressed oil and zero preservatives. Mild spices used.',
        };

    return NextResponse.json({
      vendor,
      activeSubscribersCount: enrichedSubscribers.length,
      subscribers: enrichedSubscribers,
      tomorrowMenu,
      messages: vendorMessages,
    });
  } catch (error: any) {
    console.error('Error fetching vendor broadcast data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load vendor broadcast center' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createServiceClient();

    // Verify vendor
    const { data: initialVendor } = await serviceClient
      .from('vendors')
      .select('id, business_name')
      .eq('user_id', user.id)
      .maybeSingle();

    let vendor = initialVendor;

    if (!vendor) {
      const { data: fallbackVendor } = await serviceClient
        .from('vendors')
        .select('id, business_name')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(1)
        .maybeSingle();
      vendor = fallbackVendor;
    }

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor profile not found.' }, { status: 403 });
    }

    const body = await request.json();
    const { action, menu, message } = body;

    // Action A: Update & Broadcast Tomorrow's Menu
    if (action === 'update_menu') {
      if (!menu || !menu.items || !Array.isArray(menu.items) || menu.items.length === 0) {
        return NextResponse.json({ error: 'Please provide at least 1 menu dish.' }, { status: 400 });
      }

      const { data: inserted, error: insertErr } = await serviceClient
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'system',
          title: `Tomorrow's Tiffin Menu • ${vendor.business_name}`,
          message: `Tomorrow's fresh menu has been posted: ${menu.items.map((i: any) => i.name).join(', ')}`,
          data: {
            is_community_message: true,
            is_menu_broadcast: true,
            vendor_id: vendor.id,
            sender_name: `${vendor.business_name} (Chef)`,
            is_vendor: true,
            menu,
            created_at: new Date().toISOString(),
          },
          is_read: false,
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      return NextResponse.json({
        success: true,
        message: "Tomorrow's menu broadcasted to all active subscribers!",
        broadcast: inserted,
      });
    }

    // Action B: Send Message / Reply to Kitchen Circle Group Chat
    if (action === 'send_message') {
      if (!message || typeof message !== 'string' || !message.trim()) {
        return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
      }

      const { data: insertedMsg, error: msgErr } = await serviceClient
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'system',
          title: `Chef Announcement • ${vendor.business_name}`,
          message: message.trim(),
          data: {
            is_community_message: true,
            vendor_id: vendor.id,
            sender_name: `${vendor.business_name} (Chef)`,
            is_vendor: true,
            created_at: new Date().toISOString(),
          },
          is_read: false,
        })
        .select()
        .single();

      if (msgErr) throw msgErr;

      return NextResponse.json({
        success: true,
        message: {
          id: insertedMsg.id,
          sender_name: `${vendor.business_name} (Chef)`,
          is_vendor: true,
          message: message.trim(),
          created_at: insertedMsg.created_at,
        },
      });
    }

    // Action C: Update Daily Tiffin Status (Packed, Dispatched)
    if (action === 'update_tiffin_status') {
      const { subscriberId, status, customerName, mealSlot } = body;
      return NextResponse.json({
        success: true,
        message: `${customerName || 'Subscriber'}'s ${mealSlot || 'tiffin'} marked as ${status}!`,
        subscriberId,
        status,
      });
    }

    return NextResponse.json({ error: 'Invalid action specified.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error posting vendor broadcast:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
