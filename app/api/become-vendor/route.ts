import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { resolveApplicantAccount } from '@/lib/auth/applicant-account';
import { applicationStatusOf, notifyAdmins } from '@/lib/notifications/admin-alerts';

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
      lat,
      lng,
    } = body;

    if (!businessName || !address) {
      return NextResponse.json(
        { error: 'Business name and address are required' },
        { status: 400 }
      );
    }

    const applicant = await resolveApplicantAccount({
      authUser,
      email,
      password,
      name: fullName || businessName || 'Home Chef',
      phone: phone,
      role: 'vendor',
    });
    if (!applicant.ok) return applicant.response;
    const targetUserId = applicant.userId;


    // Check if vendor record already exists for user
    const { data: existingVendor } = await serviceSupabase
      .from('vendors')
      .select('id, business_name, is_active, documents')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (existingVendor) {
      // Never change the role here: re-applying must not re-activate a declined
      // or blocked kitchen, or switch an approved rider back to an unapproved kitchen.
      const status = applicationStatusOf(existingVendor.documents);
      if (status === 'declined' || status === 'blocked') {
        return NextResponse.json(
          { error: `Your kitchen application was ${status}. Please contact support.` },
          { status: 409 }
        );
      }
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        applicationStatus: status,
        message:
          status === 'approved'
            ? 'Your kitchen is already approved.'
            : 'Your kitchen application is pending admin review.',
        vendor: { id: existingVendor.id, business_name: existingVendor.business_name, is_active: existingVendor.is_active },
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

    // Calculate valid PostGIS location (WKT POINT(lng lat))
    const vendorLat = typeof lat === 'number' && !isNaN(lat) ? lat : 18.5204;
    const vendorLng = typeof lng === 'number' && !isNaN(lng) ? lng : 73.8567;

    // Insert pending vendor record matching database schema
    const { data: vendor, error: vendorError } = await serviceSupabase
      .from('vendors')
      .insert({
        user_id: targetUserId,
        business_name: businessName,
        description: description || `${businessName} - Authentic home-cooked food`,
        cuisine: cuisine ? (Array.isArray(cuisine) ? cuisine : [cuisine]) : ['Indian'],
        location: `POINT(${vendorLng} ${vendorLat})` as any,
        address,
        phone: phone || '',
        email: applicant.email,
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
        rating: 0,
        total_orders: 0,
        // Listed only after admin approval (admin/partners/verify).
        is_active: false,
      })
      .select()
      .single();

    if (vendorError) {
      console.error('Error inserting vendor application:', vendorError);
      return NextResponse.json(
        { error: 'Failed to submit vendor application. Please try again.' },
        { status: 500 }
      );
    }

    // Role switches to vendor for review; the kitchen stays unapproved (vendors.is_approved).
    const { error: roleError } = await serviceSupabase
      .from('profiles')
      .update({ role: 'vendor', is_verified: false })
      .eq('id', targetUserId);
    if (roleError) console.error('Vendor applicant role update error:', roleError);

    // Admins review applications; the applicant gets a receipt.
    await notifyAdmins({
      title: 'New Vendor Application',
      message: `"${String(businessName).slice(0, 80)}" applied to join as a home chef. Pending review.`,
      data: { vendor_id: vendor.id, user_id: targetUserId },
    });
    try {
      await serviceSupabase.from('notifications').insert({
        user_id: targetUserId,
        type: 'system',
        title: 'Application Received',
        message: `Thanks for applying with "${String(businessName).slice(0, 80)}". We'll review it within 24-48 hours.`,
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
