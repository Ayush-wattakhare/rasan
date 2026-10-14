import { createServiceClient } from '@/lib/supabase/server';
import VendorTable from '@/components/admin/vendor-table';
import { AdminAddVendorDrawer } from '@/components/admin/admin-add-vendor-drawer';
import { ShieldCheck, Store, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function AdminVendorManagementPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = createServiceClient();
  const searchParams = await props.searchParams;

  let query = supabase
    .from('vendors')
    .select(
      `
      id, user_id, business_name, cuisine, is_active, rating, total_orders, documents, created_at, 
      profile:profiles!inner(name, email, is_verified, is_active)
    `
    )
    .order('created_at', { ascending: false });

  if (searchParams.status === 'active') {
    query = query.eq('is_active', true);
  } else if (searchParams.status === 'inactive') {
    query = query.eq('is_active', false);
  }

  if (searchParams.verified === 'true') {
    query = query.eq('profile.is_verified', true);
  } else if (searchParams.verified === 'false') {
    query = query.eq('profile.is_verified', false);
  }

  const { data: vendors, error } = await query;

  // Filter out declined or suspended applicants when viewing "Pending Approvals"
  const filteredVendors = ((vendors as any[]) || []).filter((v: any) => {
    if (searchParams.verified === 'false') {
      const status =
        v.documents && typeof v.documents === 'object' ? v.documents.application_status : null;
      if (status === 'declined' || status === 'blocked') return false;
      if (v.profile?.is_active === false) return false;
    }
    return true;
  });

  // Cast to expected type
  const transformedVendors = filteredVendors.map((v: any) => ({
    id: v.id,
    user_id: v.user_id,
    business_name: v.business_name,
    cuisine_types: v.cuisine || [],
    is_active: v.is_active,
    is_verified: v.profile?.is_verified || false,
    rating: v.rating,
    total_orders: v.total_orders,
    created_at: v.created_at,
    profile: v.profile,
    documents: v.documents,
  }));

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-32">
      {/* ── SUB-HERO ── */}
      <section className="relative overflow-hidden bg-[#1A1A1A] px-8 py-12">
        <div className="absolute top-0 right-0 -mt-32 -mr-32 h-64 w-64 rounded-full bg-orange-600/10 blur-[80px]"></div>
        <div className="relative z-10 container mx-auto flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-xl">
              <ShieldCheck className="h-4 w-4 text-orange-500" />
              <span className="text-[0.6rem] font-black tracking-[0.3em] text-white uppercase italic">
                REGISTRY ACCESS SECURED
              </span>
            </div>
            <div className="space-y-1">
              <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">
                VENDOR <span className="text-orange-600">REGISTRY</span>
              </h1>
              <p className="flex items-center gap-2 text-[0.65rem] font-bold tracking-[0.3em] text-gray-500 uppercase">
                <Store className="h-3.5 w-3.5" /> MONITORING {transformedVendors?.length || 0}{' '}
                ACTIVE OPERATOR NODES
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/vendor-management">
              <Button
                variant="outline"
                className={`h-12 rounded-xl border-white/10 px-6 text-[0.6rem] font-black tracking-widest text-white uppercase transition-all ${!searchParams.verified ? 'bg-orange-600' : 'bg-white/5 hover:bg-white/10'}`}
              >
                All Vendors
              </Button>
            </Link>
            <Link href="/vendor-management?verified=false">
              <Button
                variant="outline"
                className={`h-12 rounded-xl border-white/10 px-6 text-[0.6rem] font-black tracking-widest text-white uppercase transition-all ${searchParams.verified === 'false' ? 'bg-orange-600' : 'bg-white/5 hover:bg-white/10'}`}
              >
                Pending Approvals
              </Button>
            </Link>
            <Link href="/vendor-management?verified=true">
              <Button
                variant="outline"
                className={`h-12 rounded-xl border-white/10 px-6 text-[0.6rem] font-black tracking-widest text-white uppercase transition-all ${searchParams.verified === 'true' ? 'bg-orange-600' : 'bg-white/5 hover:bg-white/10'}`}
              >
                Verified Vendors
              </Button>
            </Link>
            {/* Divider */}
            <div className="h-12 w-px bg-white/10" />
            <AdminAddVendorDrawer />
          </div>
        </div>
      </section>

      <div className="relative z-20 container mx-auto -mt-8 px-8">
        <div className="overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-2xl">
          {error ? (
            <div className="space-y-4 p-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
                <BarChart3 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase italic">
                Protocol Failure
              </h3>
              <p className="text-sm font-bold tracking-widest text-gray-500 uppercase italic">
                {error.message}
              </p>
            </div>
          ) : (
            <div className="p-1">
              <VendorTable vendors={transformedVendors || []} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
