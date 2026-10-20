import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { rateLimitShared } from '@/lib/utils/rate-limit';

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function clientKey(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

/**
 * "Tell me when Rasan reaches my city" sign-ups from the out-of-area screen.
 * Public (no login needed), rate limited, stored in city_waitlist (migration 008).
 */
export async function POST(request: NextRequest) {
  const limit = await rateLimitShared(`waitlist:${clientKey(request)}`, { interval: 60 * 60 * 1000, maxRequests: 10 });
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const city = typeof body?.city === 'string' ? body.city.trim().slice(0, 120) : '';
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);

  if (!EMAIL.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
  }

  let userId: string | null = null;
  try {
    const { data } = await (await createClient()).auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    // Anonymous sign-up is fine.
  }

  const { error } = await (createServiceClient().from('city_waitlist' as any) as any).insert({
    email,
    city,
    lat: Number.isFinite(lat) && Math.abs(lat) <= 90 ? lat : null,
    lng: Number.isFinite(lng) && Math.abs(lng) <= 180 ? lng : null,
    user_id: userId,
  });

  // Already on the list for this city: same friendly answer.
  if (error && error.code !== '23505') {
    console.error('Waitlist insert failed:', error);
    return NextResponse.json({ error: 'Could not save your request. Please try again.' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
