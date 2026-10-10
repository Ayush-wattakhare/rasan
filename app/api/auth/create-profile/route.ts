import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// Without a session (email confirmation pending) a profile may only be created
// for an auth user that signed up moments ago with the same email.
const SIGNUP_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      email,
      name,
      phone,
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
    } = body;

    // Validate required fields
    if (!userId || !email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Security check: prevent privilege escalation to admin role
    if (role === 'admin') {
      return NextResponse.json(
        { error: 'Admin role cannot be self-assigned' },
        { status: 403 }
      );
    }

    // Allowed self-registration roles
    const safeRole: 'customer' | 'vendor' | 'delivery' = 
      role === 'vendor' || role === 'delivery' ? role : 'customer';

    // Use service role client to bypass RLS
    const supabase = createServiceClient();

    // Resolve the user from the session when there is one; never trust body.userId alone.
    const sessionClient = await createClient();
    const {
      data: { user: sessionUser },
    } = await sessionClient.auth.getUser();

    let targetUserId: string;
    let verifiedEmail: string;

    if (sessionUser) {
      targetUserId = sessionUser.id;
      verifiedEmail = sessionUser.email || email;
    } else {
      const { data: authLookup } = await supabase.auth.admin.getUserById(userId);
      const authUser = authLookup?.user;
      const createdAt = authUser?.created_at ? new Date(authUser.created_at).getTime() : 0;

      // An unconfirmed account (no session possible yet) may sign up again later,
      // keeping its original created_at, so it is accepted regardless of age.
      const isFreshSignup =
        !authUser?.email_confirmed_at || Date.now() - createdAt <= SIGNUP_WINDOW_MS;

      if (
        !authUser ||
        !authUser.email ||
        authUser.email.toLowerCase() !== String(email).toLowerCase() ||
        !isFreshSignup
      ) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      targetUserId = authUser.id;
      verifiedEmail = authUser.email;
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', targetUserId)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Profile already exists' },
        { status: 409 }
      );
    }

    // New vendors & delivery partners default to is_verified = false (Pending Admin Review)
    const isPendingReview = role === 'vendor' || role === 'delivery';
    const isVerified = !isPendingReview;

    // Create profile
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: targetUserId,
        email: verifiedEmail,
        name,
        phone: phone || null,
        role: safeRole,
        is_active: true,
        is_verified: isVerified,
      })
      .select()
      .single();

    if (error) {
      console.error('Profile creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      );
    }

    // Auto-create Vendor Application Record if role === 'vendor'
    if (role === 'vendor') {
      try {
        await supabase.from('vendors').insert({
          user_id: targetUserId,
          business_name: businessName || `${name}'s Kitchen`,
          description: businessDesc || 'Homemade culinary specialties',
          address: address || 'Main Kitchen Address',
          phone: phone || '',
          email: verifiedEmail,
          cuisine: cuisines ? cuisines.split(',').map((c: string) => c.trim()).filter(Boolean) : ['Indian', 'Homemade'],
          is_active: false,
          location: 'POINT(72.8777 19.0760)' as any,
          operating_hours: {
            monday: { is_open: true, open_time: '09:00', close_time: '21:00' },
          },
          documents: {
            fssai_license: fssai || 'FSSAI-PENDING',
            gst_number: gst || null,
          },
        } as any);
      } catch (vErr) {
        console.error('Vendor application record creation error:', vErr);
      }
    }

    // Auto-create Delivery Application Record if role === 'delivery'
    if (role === 'delivery') {
      try {
        await supabase.from('delivery_partners').insert({
          user_id: targetUserId,
          vehicle_type: (vehicleType as any) || 'bike',
          vehicle_number: vehicleNumber || 'MH01AB1234',
          license_number: licenseNumber || 'DL-PENDING',
          is_online: false,
          is_verified: false,
          rating: 5.0,
          total_deliveries: 0,
          earnings: { today: 0, this_week: 0, this_month: 0, total: 0 },
        } as any);
      } catch (dErr) {
        console.error('Delivery application record creation error:', dErr);
      }
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
