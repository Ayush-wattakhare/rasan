import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET() {
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

    // 1. Get vendor record for this user
    const { data: vendors } = await serviceClient
      .from('vendors')
      .select('id, business_name')
      .eq('user_id', user.id);

    const vendor = vendors && vendors.length > 0 ? vendors[0] : null;

    if (!vendor?.id) {
      return NextResponse.json({
        success: true,
        orders: [],
        vendor: null,
      });
    }

    // 2. Fetch orders matching THIS vendor.id strictly
    const { data: orders, error: ordersError } = await serviceClient
      .from('orders')
      .select('*')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      throw ordersError;
    }

    return NextResponse.json({
      success: true,
      orders: orders || [],
      vendor,
    });
  } catch (error: any) {
    console.error('Vendor orders API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch vendor orders' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  return handleUpdateStatus(request);
}

export async function POST(request: Request) {
  return handleUpdateStatus(request);
}

async function handleUpdateStatus(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Missing orderId or status' },
        { status: 400 }
      );
    }

    // Database enum order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'out_for_delivery' | 'delivered' | 'cancelled'
    const dbStatus = status === 'ready_for_pickup' ? 'ready' : status;

    const serviceClient = createServiceClient();

    const updatePayload: any = {
      status: dbStatus,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedOrder, error: updateError } = await serviceClient
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Order update database error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Send customer notification when food is ready
    if (dbStatus === 'ready' && updatedOrder?.customer_id) {
      try {
        await serviceClient.from('notifications').insert({
          user_id: updatedOrder.customer_id,
          type: 'order',
          title: '🍱 Meal Fresh & Ready for Pickup!',
          message: `Your food for Order #${updatedOrder.id.slice(0, 8)} is freshly packed and waiting for delivery partner pickup.`,
          is_read: false,
        });
      } catch {}
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Vendor orders PATCH error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update order status' },
      { status: 500 }
    );
  }
}
