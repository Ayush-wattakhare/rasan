import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

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
    const { amount, method, upiId, bankDetails } = body;

    if (!amount || amount < 50) {
      return NextResponse.json(
        { error: 'Minimum withdrawal amount is ₹50' },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // 1. Fetch vendor record
    const { data: vendor, error: vendorError } = await serviceClient
      .from('vendors')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (vendorError || !vendor) {
      return NextResponse.json(
        { error: 'Vendor profile not found' },
        { status: 404 }
      );
    }

    // 2. Prepare bank details payload
    const updatedBankDetails = {
      ...(vendor.bank_details || {}),
      ...(bankDetails || {}),
      upi_id: upiId || vendor.bank_details?.upi_id || '',
      preferred_payout_method: method,
    };

    // 3. Update vendor bank details
    await serviceClient
      .from('vendors')
      .update({
        bank_details: updatedBankDetails,
      })
      .eq('id', vendor.id);

    // 4. Generate Reference Transaction ID
    const refId = `TXN-VEN-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 5. Send notification
    try {
      await serviceClient.from('notifications').insert({
        user_id: user.id,
        type: 'system',
        title: '💸 Kitchen Payout Transferred!',
        message: `₹${amount.toLocaleString('en-IN')} has been wired to your ${method === 'upi' ? `UPI (${upiId})` : `Bank Account (•••• ${bankDetails?.account_number?.slice(-4) || '****'})`}. Ref: ${refId}`,
        is_read: false,
      });
    } catch {}

    return NextResponse.json({
      success: true,
      transaction: {
        id: refId,
        amount,
        method,
        destination: method === 'upi' ? upiId : `•••• ${bankDetails?.account_number?.slice(-4) || '****'}`,
        status: 'completed',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Vendor payout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process vendor payout' },
      { status: 500 }
    );
  }
}
