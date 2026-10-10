import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';
import { transitionOrder } from '@/lib/orders/transition';
import { withoutDeliveryOtp } from '@/lib/utils/delivery-otp';

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
      // Online orders reach the kitchen only once paid; abandoned checkouts stay hidden.
      .or('payment_method.eq.cash,payment_status.in.(paid,refunded)')
      .order('created_at', { ascending: false });

    if (ordersError) {
      throw ordersError;
    }

    return NextResponse.json({
      success: true,
      orders: (orders || []).map(withoutDeliveryOtp),
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
  const auth = await requireRole('vendor');
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { orderId, status } = body ?? {};

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing orderId or status' }, { status: 400 });
    }

    // Only the order's own kitchen, only allowed transitions (lib/orders/transition).
    const result = await transitionOrder({ orderId, actor: 'vendor', userId: auth.user.id, status });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      order: result.order,
      data: { order: result.order },
    });
  } catch (error) {
    console.error('Vendor order status error:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
