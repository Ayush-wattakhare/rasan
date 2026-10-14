import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/guards';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const serviceClient = createServiceClient();

    // Fetch unverified, active vendors and delivery partners who have not been declined or blocked
    const [vendorsRes, deliveryRes] = await Promise.all([
      serviceClient
        .from('vendors')
        .select(
          `
          id, user_id, business_name, address, phone, email, cuisine, documents, created_at,
          profile:profiles!inner(name, email, phone, is_verified, is_active, role)
        `
        )
        .eq('profile.is_verified', false)
        .eq('profile.is_active', true)
        .eq('profile.role', 'vendor')
        .order('created_at', { ascending: false })
        .limit(20),

      serviceClient
        .from('delivery_partners')
        .select(
          `
          id, user_id, vehicle_type, vehicle_number, license_number, documents, created_at,
          profile:profiles!inner(name, email, phone, is_verified, is_active, role)
        `
        )
        .eq('profile.is_verified', false)
        .eq('profile.is_active', true)
        .eq('profile.role', 'delivery')
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    const activeVendors = (vendorsRes.data || []).filter((v: any) => {
      const docs = v.documents;
      const status = docs && typeof docs === 'object' ? docs.application_status : null;
      return status !== 'declined' && status !== 'blocked';
    });

    const activeDelivery = (deliveryRes.data || []).filter((d: any) => {
      const docs = d.documents;
      const status = docs && typeof docs === 'object' ? docs.application_status : null;
      return status !== 'declined' && status !== 'blocked';
    });

    const applications = [
      ...activeVendors.map((v: any) => ({
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
      ...activeDelivery.map((d: any) => ({
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
