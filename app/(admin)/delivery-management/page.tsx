import { createClient } from '@/lib/supabase/server';
import DeliveryTable from '@/components/admin/delivery-table';
import { AdminAddDeliveryDrawer } from '@/components/admin/admin-add-delivery-drawer';
import { ShieldCheck, Truck, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function AdminDeliveryManagementPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const searchParams = await props.searchParams;

  let query = supabase
    .from('delivery_partners')
    .select(`
      id, user_id, vehicle_type, vehicle_number, license_number, is_online, is_verified, rating, total_deliveries, created_at,
      profile:profiles!inner(name, email, phone, is_verified)
    `)
    .order('created_at', { ascending: false });

  if (searchParams.verified === 'true') {
    query = query.eq('is_verified', true);
  } else if (searchParams.verified === 'false') {
    query = query.eq('is_verified', false);
  }

  const { data: partners, error } = await query;

  const transformedPartners = (partners as any)?.map((p: any) => ({
    id: p.id,
    user_id: p.user_id,
    vehicle_type: p.vehicle_type,
    vehicle_number: p.vehicle_number,
    license_number: p.license_number,
    is_online: p.is_online,
    is_verified: p.is_verified || p.profile?.is_verified || false,
    rating: p.rating,
    total_deliveries: p.total_deliveries,
    created_at: p.created_at,
    profile: p.profile,
  }));

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-32">
       {/* ── SUB-HERO ── */}
       <section className="relative overflow-hidden bg-[#121212] py-12 px-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          <div className="container mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
             <div className="space-y-6">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                   <ShieldCheck className="w-4 h-4 text-indigo-500" />
                   <span className="text-[0.6rem] font-black text-white uppercase tracking-[0.3em] italic">DELIVERY CORPS TERMINAL</span>
                </div>
                <div className="space-y-1">
                   <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter">
                      DELIVERY <span className="text-indigo-500">REGISTRY</span>
                   </h1>
                   <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[0.65rem] flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5" /> MANAGING {transformedPartners?.length || 0} REGISTERED RIDERS
                   </p>
                </div>
             </div>

             <div className="flex flex-wrap gap-3">
                 <Link href="/delivery-management">
                   <Button variant="outline" className={`h-12 px-6 rounded-xl border-white/10 text-white font-black uppercase tracking-widest transition-all text-[0.6rem] ${!searchParams.verified ? 'bg-indigo-600' : 'bg-white/5 hover:bg-white/10'}`}>
                      All Partners
                   </Button>
                 </Link>
                 <Link href="/delivery-management?verified=false">
                   <Button variant="outline" className={`h-12 px-6 rounded-xl border-white/10 text-white font-black uppercase tracking-widest transition-all text-[0.6rem] ${searchParams.verified === 'false' ? 'bg-indigo-600' : 'bg-white/5 hover:bg-white/10'}`}>
                      Pending Applications
                   </Button>
                 </Link>
                 <Link href="/delivery-management?verified=true">
                   <Button variant="outline" className={`h-12 px-6 rounded-xl border-white/10 text-white font-black uppercase tracking-widest transition-all text-[0.6rem] ${searchParams.verified === 'true' ? 'bg-indigo-600' : 'bg-white/5 hover:bg-white/10'}`}>
                      Verified Riders
                   </Button>
                 </Link>
                 {/* Divider */}
                 <div className="w-px h-12 bg-white/10" />
                 <AdminAddDeliveryDrawer />
              </div>
          </div>
       </section>

       <div className="container mx-auto px-8 -mt-8 relative z-20">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
             {error ? (
                <div className="p-20 text-center space-y-4">
                   <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-600">
                      <BarChart3 className="w-8 h-8" />
                   </div>
                   <h3 className="text-xl font-black uppercase italic text-gray-900">Registry Error</h3>
                   <p className="text-sm text-gray-500 font-bold uppercase tracking-widest italic">{error.message}</p>
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
