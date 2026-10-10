import { requireRole } from '@/lib/auth/guards';
import { handlePayoutRequest } from '@/lib/payouts/request-payout';

export async function POST(request: Request) {
  const auth = await requireRole('delivery');
  if (!auth.ok) return auth.response;

  try {
    return await handlePayoutRequest(request, auth.user.id, 'delivery');
  } catch (error) {
    console.error('Delivery payout error:', error);
    return Response.json({ error: 'Failed to process payout' }, { status: 500 });
  }
}
