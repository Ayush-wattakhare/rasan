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

    // 1. Fetch delivery partner record
    const { data: partner, error: partnerError } = await serviceClient
      .from('delivery_partners')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (partnerError || !partner) {
      return NextResponse.json(
        { error: 'Delivery partner record not found' },
        { status: 404 }
      );
    }

    // 2. Prepare bank details payload to persist
    const updatedBankDetails = {
      ...(partner.bank_details || {}),
      ...(bankDetails || {}),
      upi_id: upiId || partner.bank_details?.upi_id || '',
      preferred_payout_method: method,
    };

    // 3. Calculate new earnings balance
    const currentEarnings = partner.earnings || { today: 0, this_week: 0, this_month: 0, total: 0 };
    const newTotal = Math.max(0, (currentEarnings.total || 0) - amount);
    const newToday = Math.max(0, (currentEarnings.today || 0) - amount);

    const updatedEarnings = {
      ...currentEarnings,
      total: newTotal,
      today: newToday,
    };

    // 4. Update delivery partner record
    await serviceClient
      .from('delivery_partners')
      .update({
        bank_details: updatedBankDetails,
        earnings: updatedEarnings,
      })
      .eq('id', partner.id);

    // 5. Generate Reference Transaction ID
    const refId = `TXN-DEL-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 6. Push notification
    try {
      await serviceClient.from('notifications').insert({
        user_id: user.id,
        type: 'system',
        title: '💸 Instant Payout Transferred!',
        message: `₹${amount.toLocaleString('en-IN')} has been sent to your ${method === 'upi' ? `UPI (${upiId})` : `Bank Account (•••• ${bankDetails?.account_number?.slice(-4) || '****'})`}. Ref: ${refId}`,
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
      newBalance: newTotal,
    });
  } catch (error: any) {
    console.error('Delivery payout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process payout' },
      { status: 500 }
    );
  }
}
