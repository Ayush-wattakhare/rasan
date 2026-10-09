import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MessageSquare, ShieldCheck, LifeBuoy } from 'lucide-react';
import { SupportTicketsClient } from '@/components/admin/support/support-tickets-client';

export const metadata = {
  title: 'Dispute & Support Resolution Center | Rasan Admin',
  description: 'Manage and resolve customer, home chef, and delivery partner inquiries and disputes.',
};

export const dynamic = 'force-dynamic';

export default async function SupportManagementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/');

  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-32">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#1A1A1A] py-12 px-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="container mx-auto relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-orange-400 text-[0.6rem] font-black uppercase tracking-widest">
            <LifeBuoy className="w-3.5 h-3.5" /> Operations Helpdesk & Claims
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white uppercase italic tracking-tighter">
            DISPUTE & <span className="text-orange-600">SUPPORT RESOLUTION</span>
          </h1>
          <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs">
            Live Ticket Inbox • Instant Refund Triggers • Partner Compensation Rail
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-8 py-10 space-y-8 -mt-6 relative z-20">
        <SupportTicketsClient />
      </div>
    </div>
  );
}
