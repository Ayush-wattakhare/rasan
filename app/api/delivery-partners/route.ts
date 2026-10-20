import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Rider sign-up goes through POST /api/become-delivery-partner (role change,
 * admin review, notifications). Creating a rider row directly let any
 * customer skip that flow, so this endpoint is retired.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Apply through /become-delivery-partner', code: 'USE_APPLICATION_FLOW' },
    { status: 410 }
  );
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: deliveryPartner, error } = await supabase
      .from('delivery_partners')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching delivery partner:', error);
      return NextResponse.json(
        { error: 'Delivery partner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(deliveryPartner);
  } catch (error) {
    console.error('Error in GET /api/delivery-partners:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
