import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify the user is authenticated and is a delivery partner
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get delivery partner data
    const { data: deliveryPartner, error: dpError } = await supabase
      .from('delivery_partners')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (dpError || !deliveryPartner) {
      return NextResponse.json(
        { error: 'Delivery partner not found' },
        { status: 404 }
      );
    }

    // Get today's stats
    const today = new Date().toISOString().split('T')[0];
    const { data: todayOrders } = await supabase
      .from('orders')
      .select('id, delivery_fee, status')
      .eq('delivery_partner_id', deliveryPartner.id)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

    // Get this week's stats
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const { data: weekOrders } = await supabase
      .from('orders')
      .select('id, delivery_fee, status')
      .eq('delivery_partner_id', deliveryPartner.id)
      .gte('created_at', weekStart.toISOString());

    // Get this month's stats
    const monthStart = new Date();
    monthStart.setDate(1);
    const { data: monthOrders } = await supabase
      .from('orders')
      .select('id, delivery_fee, status')
      .eq('delivery_partner_id', deliveryPartner.id)
      .gte('created_at', monthStart.toISOString());

    // Calculate stats
    const todayDelivered = todayOrders?.filter(o => o.status === 'delivered') || [];
    const weekDelivered = weekOrders?.filter(o => o.status === 'delivered') || [];
    const monthDelivered = monthOrders?.filter(o => o.status === 'delivered') || [];

    const stats = {
      today: {
        deliveries: todayDelivered.length,
        earnings: todayDelivered.reduce((sum, order) => sum + (order.delivery_fee || 0), 0),
        activeOrders: todayOrders?.filter(o => ['confirmed', 'preparing', 'ready', 'ready_for_pickup', 'picked_up', 'out_for_delivery'].includes(o.status)).length || 0,
      },
      week: {
        deliveries: weekDelivered.length,
        earnings: weekDelivered.reduce((sum, order) => sum + (order.delivery_fee || 0), 0),
      },
      month: {
        deliveries: monthDelivered.length,
        earnings: monthDelivered.reduce((sum, order) => sum + (order.delivery_fee || 0), 0),
      },
      overall: {
        rating: deliveryPartner.rating,
        totalDeliveries: deliveryPartner.total_deliveries,
        totalEarnings: deliveryPartner.earnings?.total || 0,
        isOnline: deliveryPartner.is_online,
        vehicleType: deliveryPartner.vehicle_type,
        vehicleNumber: deliveryPartner.vehicle_number,
      }
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}