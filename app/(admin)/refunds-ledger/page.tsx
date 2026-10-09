import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { IndianRupee, ShieldCheck } from 'lucide-react';
import { RefundsClient } from '@/components/admin/refunds/refunds-client';

export const metadata = {
  title: 'Refunds & Settlements Ledger | Rasan Admin',
  description: 'Manage and audit customer refunds, vendor wastage reimbursements, and rider allowances.',
};

export const dynamic = 'force-dynamic';

export default async function RefundsLedgerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/');

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-32">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#1A1A1A] py-12 px-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-green-600/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="container mx-auto relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-green-400 text-[0.6rem] font-black uppercase tracking-widest">
            <IndianRupee className="w-3.5 h-3.5" /> Financial Integrity & Settlements
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white uppercase italic tracking-tighter">
            REFUNDS & <span className="text-green-500">COMPENSATION LEDGER</span>
          </h1>
          <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs">
            Customer Claim Payouts • Home Chef Wastage Credits • Rider Waiting Allowances
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-8 py-10 space-y-8 -mt-6 relative z-20">
        <RefundsClient />
      </div>
    </div>
  );
}
