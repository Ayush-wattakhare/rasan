import { createClient, createServiceClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { VendorOrdersList } from '@/components/vendor/vendor-orders-list';
import { ShieldCheck, Activity, BarChart3, Clock } from 'lucide-react';

export default async function OperationalManifestPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get vendor data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'vendor') {
    redirect('/');
  }

  const serviceClient = createServiceClient();

  // Get vendor record
  const { data: vendor } = await serviceClient
    .from('vendors')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const vendorName = vendor?.business_name || "Anita's Home Kitchen";
  const vendorId = vendor?.id;

  // Get orders for this vendor (or all latest orders in demo mode)
  let query = serviceClient
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (vendorId) {
    query = serviceClient
      .from('orders')
      .select('*')
      .eq('vendor_id', vendorId)
      // Online orders reach the kitchen only once paid; abandoned checkouts stay hidden.
      .or('payment_method.eq.cash,payment_status.in.(paid,refunded)')
      .order('created_at', { ascending: false });
  } else {
    query = serviceClient
      .from('orders')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000000');
  }

  const { data: orders } = await query;

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-32">
      {/* ── TACTICAL HEADER ── */}
      <section className="relative overflow-hidden bg-[#1A1A1A] py-16 px-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="container mx-auto flex flex-col md:flex-row md:items-end justify-between gap-10 relative z-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
              <Activity className="w-4 h-4 text-orange-500" />
              <span className="text-[0.6rem] font-black text-white uppercase tracking-[0.3em] italic">
                Real-time Order Stream Active
              </span>
            </div>
            <div className="space-y-1">
              <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none">
                MISSION <span className="text-orange-600">MANIFEST</span>
              </h1>
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[0.65rem] flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5" /> TOTAL ORDERS: {orders?.length || 0}
                </p>
                <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[0.65rem] flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> LIVE INGESTION ACTIVE
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black italic">
              {vendorName.charAt(0)}
            </div>
            <div>
              <div className="text-[0.55rem] font-black text-orange-600 uppercase tracking-widest">Operator Node</div>
              <div className="text-sm font-bold text-white uppercase italic">{vendorName}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-8 -mt-10 relative z-20">
        <VendorOrdersList initialOrders={orders || []} />
      </div>
    </div>
  );
}