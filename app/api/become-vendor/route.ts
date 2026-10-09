import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const serviceSupabase = createServiceClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    const body = await request.json();
    const {
      businessName,
      address,
      phone,
      fssai,
      gst,
      bankAccount,
      ifsc,
      cuisine,
      description,
      email,
      password,
      fullName,
    } = body;

    let targetUserId = authUser?.id;

    // If user is not logged in, create account using provided email & password
    if (!targetUserId) {
      const applicantEmail = email?.trim();
      const applicantPassword = password?.trim();

      if (!applicantEmail || !applicantPassword) {
        return NextResponse.json(
          { error: 'Please log in or enter an email and password to create your chef account.' },
          { status: 401 }
        );
      }

      const { data: newUser, error: createError } = await serviceSupabase.auth.admin.createUser({
        email: applicantEmail,
        password: applicantPassword,
        email_confirm: true,
        user_metadata: {
          name: fullName || businessName || 'Home Chef',
          role: 'vendor',
        },
      });

      if (createError) {
        if (createError.message.toLowerCase().includes('already') || createError.message.toLowerCase().includes('exists')) {
          return NextResponse.json(
            { error: 'An account with this email already exists. Please log in first.' },
            { status: 400 }
          );
        }
        throw createError;
      }

      targetUserId = newUser.user.id;

      // Upsert profile
      await serviceSupabase.from('profiles').upsert({
        id: targetUserId,
        email: applicantEmail,
        name: fullName || businessName || 'Home Chef',
        phone: phone || '',
        role: 'vendor',
        is_verified: false,
        is_active: true,
      });
    }

    if (!businessName || !address) {
      return NextResponse.json(
        { error: 'Business name and address are required' },
        { status: 400 }
      );
    }

    // Check if vendor record already exists for user
    const { data: existingVendor } = await serviceSupabase
      .from('vendors')
      .select('id, business_name, is_active')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (existingVendor) {
      await serviceSupabase.from('profiles').update({ role: 'vendor' }).eq('id', targetUserId);
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        message: 'You already have an active or pending vendor profile.',
        vendor: existingVendor,
      });
    }

    const defaultOperatingHours: any = {
      monday: { open_time: '09:00', close_time: '21:00', is_open: true },
      tuesday: { open_time: '09:00', close_time: '21:00', is_open: true },
      wednesday: { open_time: '09:00', close_time: '21:00', is_open: true },
      thursday: { open_time: '09:00', close_time: '21:00', is_open: true },
      friday: { open_time: '09:00', close_time: '21:00', is_open: true },
      saturday: { open_time: '09:00', close_time: '21:00', is_open: true },
      sunday: { open_time: '09:00', close_time: '21:00', is_open: true },
    };

    // Insert pending vendor record matching database schema
    const { data: vendor, error: vendorError } = await serviceSupabase
      .from('vendors')
      .insert({
        user_id: targetUserId,
        business_name: businessName,
        description: description || `${businessName} - Authentic home-cooked food`,
        cuisine: cuisine ? (Array.isArray(cuisine) ? cuisine : [cuisine]) : ['Indian'],
        location: 'POINT(73.8567 18.5204)' as any,
        address,
        phone: phone || '',
        email: email || authUser?.email || '',
        operating_hours: defaultOperatingHours,
        bank_details: {
          account_number: bankAccount || '',
          ifsc_code: ifsc || '',
          account_holder_name: businessName,
        },
        documents: {
          fssai_license: fssai || '',
          gst_number: gst || '',
        } as any,
        rating: 5.0,
        total_orders: 0,
        is_active: true,
      })
      .select()
      .single();

    if (vendorError) {
      console.error('Error inserting vendor application:', vendorError);
      return NextResponse.json(
        { error: `Failed to submit vendor application: ${vendorError.message}` },
        { status: 500 }
      );
    }

    // Crucial: Update user profile role to 'vendor' and set is_verified: false for admin review
    await serviceSupabase
      .from('profiles')
      .update({ role: 'vendor', is_verified: false })
      .eq('id', targetUserId);

    // Send admin notification
    try {
      await serviceSupabase.from('notifications').insert({
        user_id: targetUserId,
        type: 'system',
        title: 'New Vendor Application Submitted',
        message: `User applied to join as chef "${businessName}". Pending admin review.`,
        is_read: false,
      });
    } catch {
      // Non-critical notification failure
    }

    return NextResponse.json({
      success: true,
      message: 'Vendor application submitted successfully! Admin review in progress.',
      vendor,
      createdAccount: !authUser,
    });
  } catch (error: any) {
    console.error('Unexpected error in vendor application:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
