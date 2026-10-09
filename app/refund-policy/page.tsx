import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCcw, XCircle, Clock, AlertCircle, Zap, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Refund Protocol - Rasan Satisfaction Guarantee',
  description: 'Our transparent framework for order cancellations, refunds, and culinary satisfaction.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* ── MINIMALIST HERO ── */}
      <section className="relative overflow-hidden bg-[#1A1A1A] py-20 md:py-32">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/5 rounded-full blur-[120px] -mr-32 -mt-32"></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
               <RefreshCcw className="w-3.5 h-3.5 text-orange-500" />
               <span className="text-[0.6rem] font-black text-white uppercase tracking-[0.4em] italic">Satisfaction Guarantee</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-[0.9]">
              REFUND <br />
              <span className="text-orange-600">PROTOCOL.</span>
            </h1>
            
            <p className="text-sm font-bold text-gray-500 uppercase tracking-[0.3em]">Revision v.1.8 • Updated April 2024</p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-12 relative z-20 pb-32">
        <div className="max-w-4xl mx-auto">
          {/* ── INTRO ── */}
          <Card className="mb-12 border-none shadow-2xl bg-white rounded-[3rem] overflow-hidden">
            <CardContent className="p-10 md:p-16">
               <p className="text-xl text-gray-900 font-medium leading-relaxed italic">
                 "Culinary excellence is our baseline. If a mission fails to meet our neighborhood standards, we provide a transparent, friction-free path to resolution."
               </p>
            </CardContent>
          </Card>

          {/* ── CANCELLATION LOGIC ── */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
             <Card className="border-none shadow-sm bg-emerald-50 rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-10 space-y-4">
                   <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white">
                      <Zap className="w-6 h-6" />
                   </div>
                   <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tight italic">Instant Reversal</h3>
                   <p className="text-sm text-emerald-900/60 font-medium leading-relaxed">Cancel before the chef accepts your mission for an automated 100% refund.</p>
                </CardContent>
             </Card>
             
             <Card className="border-none shadow-sm bg-rose-50 rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-10 space-y-4">
                   <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center text-white">
                      <XCircle className="w-6 h-6" />
                   </div>
                   <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tight italic">Locked Phase</h3>
                   <p className="text-sm text-rose-900/60 font-medium leading-relaxed">Once preparation initiates, refunds are restricted to preserve culinary integrity and chef effort.</p>
                </CardContent>
             </Card>
          </div>

          <div className="space-y-12">
            {[
              {
                title: 'Eligibility Matrix',
                icon: ShieldCheck,
                content: [
                  { h: 'Logistical Anomalies', p: 'Orders marked as delivered but not physically received trigger immediate full investigation and potential refund.' },
                  { h: 'Culinary Inaccuracy', p: 'Receipt of incorrect items or poor food integrity (spoiled/unsafe) are eligible for 100% refund or instant replacement.' },
                  { h: 'Temporal Delays', p: 'Delays exceeding 60 minutes beyond the maximum estimate allow for partial or full network credits.' }
                ]
              },
              {
                title: 'Resolution Flux',
                icon: Clock,
                content: [
                  { h: 'Intel Submission', p: 'Report anomalies through the "Mission Resolution" portal in your order history within 12 hours.' },
                  { h: 'Audit Phase', p: 'Our support leads review visual evidence and logistical telemetry within 4 hours.' },
                  { h: 'Quantum Payouts', p: 'Rasan Wallet credits are instant. Bank reversals typically reflect in 3-5 standard business days.' }
                ]
              }
            ].map((section, idx) => (
              <section key={idx} className="space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white">
                       <section.icon className="w-6 h-6" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter">{section.title}</h2>
                 </div>
                 
                 <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden">
                    <CardContent className="p-8 md:p-12 space-y-8">
                       {section.content.map((item, i) => (
                          <div key={i} className="space-y-2">
                             <h3 className="text-sm font-black text-orange-600 uppercase tracking-widest">{item.h}</h3>
                             <p className="text-gray-500 font-medium leading-relaxed">{item.p}</p>
                          </div>
                       ))}
                    </CardContent>
                 </Card>
              </section>
            ))}

            {/* ── CTA ── */}
            <section className="pt-8">
               <Card className="bg-[#1A1A1A] border-none rounded-[3.5rem] p-12 md:p-20 text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/10 to-transparent"></div>
                  <div className="relative z-10 space-y-8">
                     <AlertCircle className="w-16 h-16 text-orange-600 mx-auto" />
                     <div className="space-y-4">
                        <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">NEED ASSISTANCE?</h2>
                        <p className="text-gray-400 font-medium max-w-xl mx-auto">Our support corps is on standby 24/7. Connect via live chat for instant mission intervention.</p>
                     </div>
                     <div className="pt-4 flex flex-wrap justify-center gap-4">
                        <Button className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest h-16 px-10 rounded-2xl shadow-xl transition-all" asChild>
                           <Link href="/contact">Connect to Support</Link>
                        </Button>
                        <Button variant="outline" className="border-white/10 text-white hover:bg-white hover:text-black font-black uppercase tracking-widest h-16 px-10 rounded-2xl transition-all" asChild>
                           <Link href="/partner-support">Partner Intervene</Link>
                        </Button>
                     </div>
                  </div>
               </Card>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
