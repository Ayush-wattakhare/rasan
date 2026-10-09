import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createServiceClient();

    // Fetch unverified vendors and delivery partners
    const [vendorsRes, deliveryRes] = await Promise.all([
      serviceClient
        .from('vendors')
        .select(`
          id, user_id, business_name, address, phone, email, cuisine, created_at,
          profile:profiles!inner(name, email, phone, is_verified)
        `)
        .eq('profile.is_verified', false)
        .order('created_at', { ascending: false })
        .limit(10),

      serviceClient
        .from('delivery_partners')
        .select(`
          id, user_id, vehicle_type, vehicle_number, license_number, created_at,
          profile:profiles!inner(name, email, phone, is_verified)
        `)
        .eq('profile.is_verified', false)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const applications = [
      ...(vendorsRes.data || []).map((v: any) => ({
        id: v.id,
        user_id: v.user_id,
        role: 'vendor' as const,
        name: v.profile?.name || 'Chef Applicant',
        business_name: v.business_name,
        email: v.email || v.profile?.email,
        phone: v.phone || v.profile?.phone,
        detail: v.address || 'Address submitted',
        created_at: v.created_at,
      })),
      ...(deliveryRes.data || []).map((d: any) => ({
        id: d.id,
        user_id: d.user_id,
        role: 'delivery' as const,
        name: d.profile?.name || 'Pilot Applicant',
        business_name: `${d.vehicle_type?.toUpperCase()} (${d.vehicle_number})`,
        email: d.profile?.email,
        phone: d.profile?.phone,
        detail: `DL: ${d.license_number}`,
        created_at: d.created_at,
      })),
    ];

    return NextResponse.json({
      success: true,
      applications,
      count: applications.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
