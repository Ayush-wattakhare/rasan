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
      vehicleType,
      vehicleNumber,
      licenseNumber,
      bloodGroup,
      emergencyContact,
      aadharNumber,
      bankAccountNumber,
      ifscCode,
      email,
      password,
      fullName,
      phone,
    } = body;

    if (!vehicleType || !vehicleNumber || !licenseNumber) {
      return NextResponse.json(
        { error: 'Vehicle type, vehicle number, and license number are required' },
        { status: 400 }
      );
    }

    const applicant = await resolveApplicantAccount({
      authUser,
      email,
      password,
      name: fullName || 'Delivery Partner',
      // The rider's own number only. The emergency contact is stored in documents.
      phone: typeof phone === 'string' ? phone : undefined,
      role: 'delivery',
    });
    if (!applicant.ok) return applicant.response;
    const targetUserId = applicant.userId;

    const { data: existingPartner } = await serviceSupabase
      .from('delivery_partners')
      .select('id, is_verified, documents')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (existingPartner) {
      // Never change the role here (see become-vendor for the reasoning).
      const status = applicationStatusOf(existingPartner.documents);
      if (status === 'declined' || status === 'blocked') {
        return NextResponse.json(
          { error: `Your rider application was ${status}. Please contact support.` },
          { status: 409 }
        );
      }
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        applicationStatus: existingPartner.is_verified ? 'approved' : status,
        message: existingPartner.is_verified
          ? 'Your rider account is already approved.'
          : 'Your rider application is pending admin review.',
        partner: { id: existingPartner.id },
      });
    }

    const { data: partner, error: deliveryError } = await serviceSupabase
      .from('delivery_partners')
      .insert({
        user_id: targetUserId,
        vehicle_type: vehicleType as any,
        vehicle_number: String(vehicleNumber).slice(0, 20),
        license_number: String(licenseNumber).slice(0, 30),
        is_online: false,
        rating: 0,
        total_deliveries: 0,
        bank_details: {
          account_number: bankAccountNumber || '',
          ifsc_code: ifscCode || '',
          account_holder_name: fullName || authUser?.email || '',
        },
        documents: {
          aadhar_number: aadharNumber || '',
          blood_group: bloodGroup || '',
          emergency_contact: emergencyContact || '',
        } as any,
        earnings: { today: 0, this_week: 0, this_month: 0, total: 0 },
        is_verified: false,
      })
      .select('id, vehicle_type, vehicle_number, is_verified')
      .single();

    if (deliveryError) {
      console.error('Error inserting delivery application:', deliveryError);
      return NextResponse.json(
        { error: 'Failed to submit delivery partner application. Please try again.' },
        { status: 500 }
      );
    }

    const { error: roleError } = await serviceSupabase
      .from('profiles')
      .update({ role: 'delivery', is_verified: false })
      .eq('id', targetUserId);
    if (roleError) console.error('Rider applicant role update error:', roleError);

    await notifyAdmins({
      title: 'New Delivery Partner Application',
      message: `Rider application (${vehicleType} · ${String(vehicleNumber).slice(0, 20)}) is pending review.`,
      data: { delivery_partner_id: partner.id, user_id: targetUserId },
    });
    try {
      await serviceSupabase.from('notifications').insert({
        user_id: targetUserId,
        type: 'system',
        title: 'Application Received',
        message: "Thanks for applying to ride with Rasan. We'll review your documents within 24-48 hours.",
        is_read: false,
      });
    } catch {
      // Non-critical notification error
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery partner application submitted! Admin review in progress.',
      partner,
      createdAccount: !authUser,
    });
  } catch (error) {
    console.error('Unexpected error in delivery partner application:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
