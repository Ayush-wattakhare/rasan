import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { OrderTrackingClient } from '@/components/orders/order-tracking-client';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerOrderDetailsPage({ params }: OrderPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/orders/' + id);
  }

  // Get order
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .eq('customer_id', user.id)
    .single();

  if (error || !order) {
    redirect('/orders');
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header - Premium Navigation */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="space-y-4">
             <Link href="/orders">
                <Button
                    variant="ghost"
                    className="p-0 hover:bg-transparent text-gray-400 hover:text-orange-600 font-bold uppercase tracking-widest text-[0.65rem] flex items-center gap-2 group"
                  >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Archive of Deliveries
                </Button>
             </Link>
             <div className="space-y-1">
                <p className="text-[0.65rem] font-black text-orange-600 uppercase tracking-[0.2em] italic">Impact Tracking</p>
                <h1 className="text-4xl md:text-5xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
                  Order <span className="text-gray-300">#{order.order_number}</span>
                </h1>
             </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm transition-transform hover:scale-105">
             <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-xl">🚚</div>
             <p className="text-[0.65rem] font-black text-gray-400 uppercase tracking-wider leading-relaxed">
               Estimated Arrival <br />
               <span className="text-gray-900 font-black">Fast Hyperlocal Delivery</span>
             </p>
          </div>
        </div>

        {/* Live Order Tracking Container with Realtime & Auto-Polling */}
        <OrderTrackingClient initialOrder={order} />
      </div>
    </div>
  );
}
