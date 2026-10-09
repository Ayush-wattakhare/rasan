import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/guards';

// Read-only: returns the caller's vendor record, or null if they have not applied yet.
// Vendor records are created only through /api/become-vendor (pending admin approval).
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { data: vendors, error } = await createServiceClient()
      .from('vendors')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Vendor fetch error:', error);
      return NextResponse.json({ error: 'Failed to load vendor profile' }, { status: 500 });
    }

    const vendor = vendors?.[0] ?? null;
    return NextResponse.json({
      success: true,
      data: { vendor, vendorCount: vendor ? 1 : 0, vendorError: null },
    });
  } catch (error) {
    console.error('Error in check-status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
