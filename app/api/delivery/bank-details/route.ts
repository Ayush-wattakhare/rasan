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
    const { data: partner } = await serviceClient
      .from('delivery_partners')
      .select('bank_details, earnings')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      bankDetails: partner?.bank_details || null,
      earnings: partner?.earnings || { total: 0, today: 0 },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bank details' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
    const { bankDetails } = body;

    const serviceClient = createServiceClient();
    const { data: partner } = await serviceClient
      .from('delivery_partners')
      .select('id, bank_details')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!partner) {
      return NextResponse.json(
        { error: 'Delivery partner record not found' },
        { status: 404 }
      );
    }

    const updated = {
      ...(partner.bank_details || {}),
      ...(bankDetails || {}),
    };

    const { error: updateError } = await serviceClient
      .from('delivery_partners')
      .update({ bank_details: updated })
      .eq('id', partner.id);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      bankDetails: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update bank details' },
      { status: 500 }
    );
  }
}
