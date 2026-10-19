import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// Without a session (email confirmation pending) a profile may only be created
// for an auth user that signed up moments ago with the same email.
const SIGNUP_WINDOW_MS = 15 * 60 * 1000;

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      userId,
      email, // optional for phone-only signups
      role,
      businessName,
      businessDesc,
      fssai,
      gst,
      address,
      cuisines,
      vehicleType,
      vehicleNumber,
      licenseNumber,
    } = body ?? {};
    const name = cleanText(body?.name, 100);

    if (!userId || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (role === 'admin') {
      return NextResponse.json({ error: 'Admin role cannot be self-assigned' }, { status: 403 });
    }
    const safeRole: 'customer' | 'vendor' | 'delivery' =
      role === 'vendor' || role === 'delivery' ? role : 'customer';

    if (safeRole === 'delivery' && (!cleanText(vehicleNumber, 20) || !cleanText(licenseNumber, 30))) {
      return NextResponse.json(
        { error: 'Vehicle number and driving license number are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Resolve the user from the session when there is one; never trust body.userId alone.
    const sessionClient = await createClient();
    const {
      data: { user: sessionUser },
    } = await sessionClient.auth.getUser();

    let authUser = sessionUser;
    if (!authUser) {
      const { data: authLookup } = await supabase.auth.admin.getUserById(String(userId));
      const candidate = authLookup?.user ?? null;
      if (!candidate) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Phone-OTP sign-ups always have a session after verifying the code.
      // Without one, only a brand-new email sign-up with the same email qualifies.
      const createdAt = candidate.created_at ? new Date(candidate.created_at).getTime() : 0;
      const isFresh = Date.now() - createdAt <= SIGNUP_WINDOW_MS;
      const emailMatches =
        !!candidate.email &&
        typeof email === 'string' &&
        candidate.email.toLowerCase() === email.trim().toLowerCase();

      if (!emailMatches || !isFresh) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      authUser = candidate;
    }

    const targetUserId = authUser.id;
    const verifiedEmail = authUser.email || null;
    // Phone comes from the auth record when Supabase verified it (OTP); a typed
    // number is stored unverified so it can't block anyone else's phone sign-up.
    const authPhone = authUser.phone ? `+${String(authUser.phone).replace(/^\+/, '')}` : null;
    const phoneVerified = !!authPhone && !!authUser.phone_confirmed_at;
    const phone = phoneVerified ? authPhone : cleanText(body?.phone, 20);

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', targetUserId)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json({ error: 'Profile already exists' }, { status: 409 });
    }

    // New vendors & delivery partners start unverified (pending admin review).
    const isPendingReview = safeRole !== 'customer';

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: targetUserId,
        email: verifiedEmail,
        name,
        phone,
        phone_verified: phoneVerified,
        role: safeRole,
        is_active: true,
        is_verified: !isPendingReview,
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Profile creation error:', error);
      const duplicatePhone = error.code === '23505' && /phone/i.test(error.message);
      return NextResponse.json(
        { error: duplicatePhone ? 'This phone number is already registered.' : 'Failed to create profile' },
        { status: duplicatePhone ? 409 : 500 }
      );
    }

    // Partner application rows. A failure here must not leave a vendor/delivery
    // role without an application (it would never reach the admin review queue).
    let partnerError: unknown = null;

    if (safeRole === 'vendor') {
      const { error: vErr } = await supabase.from('vendors').insert({
        user_id: targetUserId,
        business_name: cleanText(businessName, 100) || `${name}'s Kitchen`,
        description: cleanText(businessDesc, 1000) || 'Homemade culinary specialties',
        address: cleanText(address, 300) || 'Address to be updated',
        phone: phone || '',
        email: verifiedEmail || '',
        cuisine:
          typeof cuisines === 'string' && cuisines.trim()
            ? cuisines.split(',').map((c: string) => c.trim().slice(0, 40)).filter(Boolean).slice(0, 10)
            : ['Indian', 'Homemade'],
        is_active: false,
        // vendors.location is NOT NULL: placeholder until the chef pins the kitchen
        // (treated as "not set" by parseVendorLocation).
        location: 'POINT(72.8777 19.0760)' as any,
        operating_hours: {
          monday: { is_open: true, open_time: '09:00', close_time: '21:00' },
        },
        documents: {
          fssai_license: cleanText(fssai, 30) || 'FSSAI-PENDING',
          gst_number: cleanText(gst, 20),
        },
      } as any);
      partnerError = vErr;
    }

    if (safeRole === 'delivery') {
      const { error: dErr } = await supabase.from('delivery_partners').insert({
        user_id: targetUserId,
        vehicle_type: ['bike', 'scooter', 'car'].includes(vehicleType) ? vehicleType : 'bike',
        vehicle_number: cleanText(vehicleNumber, 20)!,
        license_number: cleanText(licenseNumber, 30)!,
        is_online: false,
        is_verified: false,
        rating: 0,
        total_deliveries: 0,
        earnings: { today: 0, this_week: 0, this_month: 0, total: 0 },
      } as any);
      partnerError = dErr;
    }

    if (partnerError) {
      console.error('Partner application record creation error:', partnerError);
      await supabase.from('profiles').delete().eq('id', targetUserId);
      return NextResponse.json(
        { error: 'Could not save your partner application. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
