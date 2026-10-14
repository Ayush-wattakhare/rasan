import { createServiceClient } from '@/lib/supabase/server';
import DeliveryTable from '@/components/admin/delivery-table';
import { AdminAddDeliveryDrawer } from '@/components/admin/admin-add-delivery-drawer';
import { ShieldCheck, Truck, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function AdminDeliveryManagementPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = createServiceClient();
  const searchParams = await props.searchParams;

  let query = supabase
    .from('delivery_partners')
    .select(
      `
      id, user_id, vehicle_type, vehicle_number, license_number, is_online, is_verified, rating, total_deliveries, documents, created_at,
      profile:profiles!inner(name, email, phone, is_verified, is_active)
    `
    )
    .order('created_at', { ascending: false });

  if (searchParams.verified === 'true') {
    query = query.eq('profile.is_verified', true);
  } else if (searchParams.verified === 'false') {
    query = query.eq('profile.is_verified', false);
  }

  const { data: partners, error } = await query;

  // Filter out declined or suspended applicants when viewing "Pending Applications"
  const filteredPartners = ((partners as any[]) || []).filter((p: any) => {
    if (searchParams.verified === 'false') {
      const status =
        p.documents && typeof p.documents === 'object' ? p.documents.application_status : null;
      if (status === 'declined' || status === 'blocked') return false;
      if (p.profile?.is_active === false) return false;
    }
    return true;
  });

  const transformedPartners = filteredPartners.map((p: any) => ({
    id: p.id,
    user_id: p.user_id,
    vehicle_type: p.vehicle_type,
    vehicle_number: p.vehicle_number,
    license_number: p.license_number,
    is_online: p.is_online,
    is_verified: p.is_verified || p.profile?.is_verified || false,
    rating: p.rating,
    total_deliveries: p.total_deliveries,
    documents: p.documents,
    created_at: p.created_at,
    profile: p.profile,
  }));

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-32">
      {/* ── SUB-HERO ── */}
      <section className="relative overflow-hidden bg-[#121212] px-8 py-12">
        <div className="absolute top-0 right-0 -mt-32 -mr-32 h-64 w-64 rounded-full bg-indigo-600/10 blur-[80px]"></div>
        <div className="relative z-10 container mx-auto flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-xl">
              <ShieldCheck className="h-4 w-4 text-indigo-500" />
              <span className="text-[0.6rem] font-black tracking-[0.3em] text-white uppercase italic">
                DELIVERY CORPS TERMINAL
              </span>
            </div>
            <div className="space-y-1">
              <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">
                DELIVERY <span className="text-indigo-500">REGISTRY</span>
              </h1>
              <p className="flex items-center gap-2 text-[0.65rem] font-bold tracking-[0.3em] text-gray-500 uppercase">
                <Truck className="h-3.5 w-3.5" /> MANAGING {transformedPartners?.length || 0}{' '}
                REGISTERED RIDERS
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/delivery-management">
              <Button
                variant="outline"
                className={`h-12 rounded-xl border-white/10 px-6 text-[0.6rem] font-black tracking-widest text-white uppercase transition-all ${!searchParams.verified ? 'bg-indigo-600' : 'bg-white/5 hover:bg-white/10'}`}
              >
                All Partners
              </Button>
            </Link>
            <Link href="/delivery-management?verified=false">
              <Button
                variant="outline"
                className={`h-12 rounded-xl border-white/10 px-6 text-[0.6rem] font-black tracking-widest text-white uppercase transition-all ${searchParams.verified === 'false' ? 'bg-indigo-600' : 'bg-white/5 hover:bg-white/10'}`}
              >
                Pending Applications
              </Button>
            </Link>
            <Link href="/delivery-management?verified=true">
              <Button
                variant="outline"
                className={`h-12 rounded-xl border-white/10 px-6 text-[0.6rem] font-black tracking-widest text-white uppercase transition-all ${searchParams.verified === 'true' ? 'bg-indigo-600' : 'bg-white/5 hover:bg-white/10'}`}
              >
                Verified Riders
              </Button>
            </Link>
            {/* Divider */}
            <div className="h-12 w-px bg-white/10" />
            <AdminAddDeliveryDrawer />
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
              <h3 className="text-xl font-black text-gray-900 uppercase italic">Registry Error</h3>
              <p className="text-sm font-bold tracking-widest text-gray-500 uppercase italic">
                {error.message}
              </p>
            </div>
          ) : (
            <div className="p-1">
              <DeliveryTable partners={transformedPartners || []} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
