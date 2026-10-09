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
    const { data: vendor } = await serviceClient
      .from('vendors')
      .select('id, business_name, bank_details')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      bankDetails: vendor?.bank_details || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch vendor bank details' },
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
    const { data: vendor } = await serviceClient
      .from('vendors')
      .select('id, bank_details')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor record not found' },
        { status: 404 }
      );
    }

    const updated = {
      ...(vendor.bank_details || {}),
      ...(bankDetails || {}),
    };

    const { error: updateError } = await serviceClient
      .from('vendors')
      .update({ bank_details: updated })
      .eq('id', vendor.id);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      bankDetails: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update vendor bank details' },
      { status: 500 }
    );
  }
}
