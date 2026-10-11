import { requireRole } from '@/lib/auth/guards';
import { handlePayoutRequest } from '@/lib/payouts/request-payout';

export async function POST(request: Request) {
  const auth = await requireRole('vendor');
  if (!auth.ok) return auth.response;

  try {
    return await handlePayoutRequest(request, auth.user.id, 'vendor');
  } catch (error) {
    console.error('Vendor payout error:', error);
    return Response.json({ error: 'Failed to process vendor payout' }, { status: 500 });
  }
}
