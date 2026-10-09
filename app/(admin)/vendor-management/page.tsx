import { createClient } from '@/lib/supabase/server';
import VendorTable from '@/components/admin/vendor-table';
import { AdminAddVendorDrawer } from '@/components/admin/admin-add-vendor-drawer';
import { ShieldCheck, Store, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';


export default async function AdminVendorManagementPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const searchParams = await props.searchParams;

  let query = supabase
    .from('vendors')
    .select(`
      id, user_id, business_name, cuisine, is_active, rating, total_orders, created_at, 
      profile:profiles!inner(name, email, is_verified)
    `)
    .order('created_at', { ascending: false });

  if (searchParams.status === 'active') {
    query = query.eq('is_active', true);
  } else if (searchParams.status === 'inactive') {
    query = query.eq('is_active', false);
  }

  if (searchParams.verified === 'true') {
    query = query.eq('profiles.is_verified', true);
  } else if (searchParams.verified === 'false') {
    query = query.eq('profiles.is_verified', false);
  }

  const { data: vendors, error } = await query;

  // Cast to expected type
  const transformedVendors = (vendors as any)?.map((v: any) => ({
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
  }));

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-32">
       {/* ── SUB-HERO ── */}
       <section className="relative overflow-hidden bg-[#1A1A1A] py-12 px-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          <div className="container mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
             <div className="space-y-6">
                <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                   <ShieldCheck className="w-4 h-4 text-orange-500" />
                   <span className="text-[0.6rem] font-black text-white uppercase tracking-[0.3em] italic">REGISTRY ACCESS SECURED</span>
                </div>
                <div className="space-y-1">
                   <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter">
                      VENDOR <span className="text-orange-600">REGISTRY</span>
                   </h1>
                   <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[0.65rem] flex items-center gap-2">
                      <Store className="w-3.5 h-3.5" /> MONITORING {transformedVendors?.length || 0} ACTIVE OPERATOR NODES
                   </p>
                </div>
             </div>

              <div className="flex flex-wrap gap-3">
                 <Link href="/vendor-management">
                   <Button variant="outline" className={`h-12 px-6 rounded-xl border-white/10 text-white font-black uppercase tracking-widest transition-all text-[0.6rem] ${!searchParams.verified ? 'bg-orange-600' : 'bg-white/5 hover:bg-white/10'}`}>
                      All Vendors
                   </Button>
                 </Link>
                 <Link href="/vendor-management?verified=false">
                   <Button variant="outline" className={`h-12 px-6 rounded-xl border-white/10 text-white font-black uppercase tracking-widest transition-all text-[0.6rem] ${searchParams.verified === 'false' ? 'bg-orange-600' : 'bg-white/5 hover:bg-white/10'}`}>
                      Pending Approvals
                   </Button>
                 </Link>
                 <Link href="/vendor-management?verified=true">
                   <Button variant="outline" className={`h-12 px-6 rounded-xl border-white/10 text-white font-black uppercase tracking-widest transition-all text-[0.6rem] ${searchParams.verified === 'true' ? 'bg-orange-600' : 'bg-white/5 hover:bg-white/10'}`}>
                      Verified Vendors
                   </Button>
                 </Link>
                 {/* Divider */}
                 <div className="w-px h-12 bg-white/10" />
                 <AdminAddVendorDrawer />
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
                   <h3 className="text-xl font-black uppercase italic text-gray-900">Protocol Failure</h3>
                   <p className="text-sm text-gray-500 font-bold uppercase tracking-widest italic">{error.message}</p>
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
