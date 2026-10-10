import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/guards';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { 
      email, password, name, phone, role, 
      businessName, address, fssai, gst, bankAccount, ifsc, // vendor fields
      vehicleType, vehicleNumber, licenseNumber, age, bloodGroup, emergencyContact, aadharNumber, bankAccountNumber, ifscCode // delivery fields
    } = body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Email, password, name, and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['vendor', 'delivery'].includes(role)) {
      return NextResponse.json(
        { error: 'Only vendor and delivery roles can be created by admin' },
        { status: 400 }
      );
    }

    // Use service role client to create user
    const serviceSupabase = createServiceClient();

    // Create auth user
    const { data: authData, error: authUserError } = await serviceSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        phone,
        role,
      },
    });

    if (authUserError) {
      console.error('Auth user creation error:', authUserError);
      return NextResponse.json(
        { error: authUserError.message },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create auth user' },
        { status: 500 }
      );
    }

    // Create profile
    const { error: profileError } = await serviceSupabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        name,
        phone: phone || null,
        role,
        is_active: true,
        is_verified: true,
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return NextResponse.json(
        { error: `Failed to create profile: ${profileError.message}` },
        { status: 500 }
      );
    }

    // Create vendor or delivery partner specific record
    if (role === 'vendor') {
      if (!businessName) {
        return NextResponse.json(
          { error: 'Business name is required for vendors' },
          { status: 400 }
        );
      }

      const vendorBankDetails = body.bank_details || {
        account_number: bankAccount || null,
        ifsc_code: ifsc || null,
        account_holder_name: name,
        bank_name: body.bankName || null,
        upi_id: body.upiId || null,
        preferred_payout_method: body.upiId ? 'upi' : 'bank',
      };

      let vendorError;
      const vendorPayload = {
        user_id: authData.user.id,
        business_name: businessName,
        description: `${businessName} - Home-cooked meals`,
        cuisine: ['Indian'], // Default cuisine
        location: 'POINT(72.8777 19.0760)' as any,
        address: address || 'Address to be updated',
        phone: phone || email,
        email,
        fssai_license: fssai || null,
        gst_number: gst || null,
        bank_details: vendorBankDetails,
        operating_hours: {
          monday: { open_time: '09:00', close_time: '21:00', is_open: true },
          tuesday: { open_time: '09:00', close_time: '21:00', is_open: true },
          wednesday: { open_time: '09:00', close_time: '21:00', is_open: true },
          thursday: { open_time: '09:00', close_time: '21:00', is_open: true },
          friday: { open_time: '09:00', close_time: '21:00', is_open: true },
          saturday: { open_time: '09:00', close_time: '21:00', is_open: true },
          sunday: { open_time: '09:00', close_time: '21:00', is_open: true },
        },
        rating: 4.5,
        total_orders: 0,
        is_active: true,
      };

      const res = await serviceSupabase.from('vendors').insert([vendorPayload]);
      vendorError = res.error;

      // If PostGIS WKT location fails, retry without spatial location column
      if (vendorError && vendorError.message.includes('location')) {
        delete (vendorPayload as any).location;
        const retryRes = await serviceSupabase.from('vendors').insert([vendorPayload]);
        vendorError = retryRes.error;
      }

      if (vendorError) {
        console.error('Vendor creation error:', vendorError);
        return NextResponse.json(
          { error: `Failed to create vendor: ${vendorError.message}` },
          { status: 500 }
        );
      }
    } else if (role === 'delivery') {
      if (!vehicleType || !vehicleNumber || !licenseNumber) {
        return NextResponse.json(
          { error: 'Vehicle type, vehicle number, and license number are required for delivery partners' },
          { status: 400 }
        );
      }

      const deliveryBankDetails = body.bank_details || {
        account_number: bankAccountNumber || null,
        ifsc_code: ifscCode || null,
        account_holder_name: name,
        bank_name: body.bankName || null,
        upi_id: body.upiId || null,
        preferred_payout_method: body.upiId ? 'upi' : 'bank',
      };

      const { error: deliveryError } = await serviceSupabase
        .from('delivery_partners')
        .insert([{
          user_id: authData.user.id,
          vehicle_type: vehicleType,
          vehicle_number: vehicleNumber,
          license_number: licenseNumber,
          is_online: false,
          rating: 4.0,
          total_deliveries: 0,
          blood_group: bloodGroup || null,
          emergency_contact: emergencyContact || null,
          aadhar_number: aadharNumber || null,
          bank_details: deliveryBankDetails,
          earnings: {
            today: 0,
            this_week: 0,
            this_month: 0,
            total: 0,
          },
          is_verified: true, // Admin registered partner is verified
        }]);

      if (deliveryError) {
        console.error('Delivery partner creation error:', deliveryError);
        return NextResponse.json(
          { error: `Failed to create delivery partner: ${deliveryError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `${role} created successfully`,
      user: {
        id: authData.user.id,
        email,
        name,
        role,
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}