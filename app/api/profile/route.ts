import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { sanitizeAddressFields } from '@/lib/utils/address';
import { requireUser } from '@/lib/auth/guards';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/** Profile addresses need street, city and PIN code; coordinates are optional. */
const sanitizeAddress = (raw: unknown) => sanitizeAddressFields(raw, ['street', 'city', 'zip_code']);

export async function PUT(request: NextRequest) {
  try {
    // Signed in and not suspended.
    const auth = await requireUser();
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const { name, phone, address } = body as Record<string, unknown>;

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      }
      updateData.name = name.trim().slice(0, 100);
    }

    let phoneChanged = false;
    if (phone !== undefined) {
      const cleaned = typeof phone === 'string' ? phone.replace(/[\s-]/g, '') : '';
      if (cleaned && !/^\+?\d{10,15}$/.test(cleaned)) {
        return NextResponse.json({ error: 'Enter a valid phone number' }, { status: 400 });
      }
      const { data: current } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .maybeSingle();
      const next = cleaned || null;
      if ((current?.phone ?? null) !== next) {
        updateData.phone = next;
        // A typed number is unverified until confirmed by OTP (migration 006).
        updateData.phone_verified = false;
        phoneChanged = true;
      }
    }

    if (address !== undefined) {
      const sanitized = sanitizeAddress(address);
      if ('error' in sanitized) {
        return NextResponse.json({ error: sanitized.error }, { status: 400 });
      }
      updateData.address = sanitized.address;
    }

    // phone / phone_verified are not user-writable (migration 006), so write
    // with the service role; the row is still scoped to the signed-in user.
    const { data: profile, error } = await createServiceClient()
      .from('profiles')
      .update(updateData as any)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ ...profile, phoneChanged });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
