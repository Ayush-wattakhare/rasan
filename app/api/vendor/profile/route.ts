import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { parseVendorLocation as parseLocation } from '@/lib/utils/geo';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    const { data: vendor, error } = await serviceClient
      .from('vendors')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !vendor) {
      return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
    }

    const coords = parseLocation(vendor.location);

    return NextResponse.json({
      success: true,
      vendor: {
        ...vendor,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch vendor profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      business_name,
      description,
      cuisine,
      address,
      phone,
      email,
      operating_hours,
      bank_details,
      is_active,
      lat,
      lng,
    } = body;

    const serviceClient = createServiceClient();
    
    // Ensure this vendor record belongs to authenticated user
    const { data: existingVendor } = await serviceClient
      .from('vendors')
      .select('id, user_id, is_active, is_approved')
      .eq('user_id', user.id)
      .eq('id', id)
      .maybeSingle();

    if (!existingVendor) {
      return NextResponse.json({ error: 'Vendor record not found or access denied' }, { status: 404 });
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (business_name !== undefined) updateData.business_name = String(business_name).trim();
    if (description !== undefined) updateData.description = String(description).trim() || null;
    if (cuisine !== undefined) {
      updateData.cuisine = Array.isArray(cuisine)
        ? cuisine
        : String(cuisine).split(',').map((c) => c.trim()).filter(Boolean);
    }
    if (address !== undefined) updateData.address = String(address).trim();
    if (phone !== undefined) updateData.phone = String(phone).trim();
    if (email !== undefined) updateData.email = String(email).trim();
    if (operating_hours !== undefined) updateData.operating_hours = operating_hours;
    if (bank_details !== undefined) updateData.bank_details = bank_details;
    if (is_active !== undefined) {
      // Only admin-approved kitchens may open themselves (closing is always allowed).
      if (Boolean(is_active) && !existingVendor.is_approved) {
        return NextResponse.json(
          { error: 'Your kitchen is awaiting admin approval and cannot go live yet.' },
          { status: 403 }
        );
      }
      updateData.is_active = Boolean(is_active);
    }

    // If valid GPS coordinates are supplied, update PostGIS geography point
    if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
      updateData.location = `POINT(${lng} ${lat})`;
    }

    const { data: updated, error: updateError } = await serviceClient
      .from('vendors')
      .update(updateData)
      .eq('id', existingVendor.id)
      .select()
      .single();

    if (updateError) {
      console.error('Vendor profile update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Vendor profile and kitchen location updated successfully',
      vendor: updated,
    });
  } catch (error: any) {
    console.error('Vendor profile update exception:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update vendor profile' },
      { status: 500 }
    );
  }
}
