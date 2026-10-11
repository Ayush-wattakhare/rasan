import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { resolveApplicantAccount } from '@/lib/auth/applicant-account';

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
      age,
      bloodGroup,
      emergencyContact,
      aadharNumber,
      bankAccountNumber,
      ifscCode,
      email,
      password,
      fullName,
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
      phone: emergencyContact,
      role: 'delivery',
    });
    if (!applicant.ok) return applicant.response;
    const targetUserId = applicant.userId;


    // Check if delivery record already exists for user
    const { data: existingPartner } = await serviceSupabase
      .from('delivery_partners')
      .select('id')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (existingPartner) {
      await serviceSupabase.from('profiles').update({ role: 'delivery' }).eq('id', targetUserId);
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        message: 'You already have an active or pending delivery partner profile.',
        partner: existingPartner,
      });
    }

    // Insert pending delivery partner record matching Database schema
    const { data: partner, error: deliveryError } = await serviceSupabase
      .from('delivery_partners')
      .insert({
        user_id: targetUserId,
        vehicle_type: vehicleType as any,
        vehicle_number: vehicleNumber,
        license_number: licenseNumber,
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
      .select()
      .single();

    if (deliveryError) {
      console.error('Error inserting delivery application:', deliveryError);
      return NextResponse.json(
        { error: `Failed to submit delivery partner application: ${deliveryError.message}` },
        { status: 500 }
      );
    }

    // Crucial: Update user profile role to 'delivery' and set is_verified: false for admin review
    await serviceSupabase
      .from('profiles')
      .update({ role: 'delivery', is_verified: false })
      .eq('id', targetUserId);

    // Send admin notification
    try {
      await serviceSupabase.from('notifications').insert({
        user_id: targetUserId,
        type: 'system',
        title: 'New Delivery Partner Application',
        message: `Rider application submitted (${vehicleType} - ${vehicleNumber}). Pending admin review.`,
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
  } catch (error: any) {
    console.error('Unexpected error in delivery partner application:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
