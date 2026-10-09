import { OrderLifecycleSimulator } from '@/components/dev/order-lifecycle-simulator';

export const metadata = {
  title: 'Order Lifecycle Simulator | Rasan Developer Lab',
  description: 'Interactive end-to-end multi-party order lifecycle simulation connecting Customer, Chef, Rider, and Admin.',
};

export default function OrderSimulatorPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF9] pb-32">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#1A1A1A] py-12 px-8">
        <div className="container mx-auto relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-orange-400 text-[0.6rem] font-black uppercase tracking-widest">
            Laboratory & Demonstration Sandbox
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white uppercase italic tracking-tighter">
            END-TO-END <span className="text-orange-500">ORDER LIFECYCLE SIMULATOR</span>
          </h1>
          <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs">
            Customer PIN Handover • Kitchen Batch Dispatch • Tactical Rider GPS • 7% Platform Commission (93% Chef Net)
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-8 py-10 -mt-6 relative z-20">
        <OrderLifecycleSimulator />
      </div>
    </div>
  );
}
