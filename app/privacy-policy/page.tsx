import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Lock, Eye, FileText, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Protocol - Rasan',
  description: 'Our commitment to your data sovereignty and privacy excellence.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* ── MINIMALIST HERO ── */}
      <section className="relative overflow-hidden bg-[#1A1A1A] py-20 md:py-32">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/5 rounded-full blur-[120px] -mr-32 -mt-32"></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
               <Shield className="w-3.5 h-3.5 text-orange-500" />
               <span className="text-[0.6rem] font-black text-white uppercase tracking-[0.4em] italic">Data Sovereignty</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-[0.9]">
              PRIVACY <br />
              <span className="text-orange-600">PROTOCOL.</span>
            </h1>
            
            <p className="text-sm font-bold text-gray-500 uppercase tracking-[0.3em]">Revision v.4.0 • Updated April 2024</p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-12 relative z-20 pb-32">
        <div className="max-w-4xl mx-auto">
          {/* ── INTRO ── */}
          <Card className="mb-12 border-none shadow-2xl bg-white rounded-[3rem] overflow-hidden">
            <CardContent className="p-10 md:p-16">
               <p className="text-xl text-gray-900 font-medium leading-relaxed italic">
                 "At Rasan, we believe privacy is a fundamental human right. Our protocol is designed to maximize your autonomy while delivering a seamless, high-performance community experience."
               </p>
            </CardContent>
          </Card>

          {/* ── CORE SECTIONS ── */}
          <div className="space-y-12">
            {[
              {
                id: 'collection',
                title: 'Data Ingestion',
                icon: Eye,
                content: [
                  { h: 'Identity Markers', p: 'We collect essential identifiers (name, cryptographic hashes, contacts) to facilitate secure network participation.' },
                  { h: 'Spatial Intel', p: 'Precision location data is processed exclusively during active mission windows to optimize logistics routing.' },
                  { h: 'Telemetry', p: 'Anonymized usage patterns help us refine the neighborhood experience without compromising individual anonymity.' }
                ]
              },
              {
                id: 'usage',
                title: 'Operational Intent',
                icon: Zap,
                content: [
                  { h: 'Fulfillment Logistics', p: 'Primary usage is the successful bridging of neighborhood kitchens to customer nodes.' },
                  { h: 'Predictive Growth', p: 'Aggregated data powers our demand-prediction engines to support local chef expansion.' },
                  { h: 'Security Matrix', p: 'Behavioral analysis is deployed to prevent fraud and maintain the integrity of the ecosystem.' }
                ]
              },
              {
                id: 'sharing',
                title: 'Network Disclosure',
                icon: Lock,
                content: [
                  { h: 'Peer Disclosure', p: 'Minimal necessary intel shared with partners to ensure physical fulfillment.' },
                  { h: 'Infrastructure Partners', p: 'Only industry-standard, high-security providers (Stripe, Vercel) process your data.' },
                  { h: 'Legal Sovereignty', p: 'We only disclose data when strictly mandated by verifiable legal protocols.' }
                ]
              }
            ].map((section, idx) => (
              <section key={idx} id={section.id} className="space-y-6">
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

            {/* ── SOVEREIGNTY ── */}
            <section className="pt-8">
               <Card className="bg-[#1A1A1A] border-none rounded-[3.5rem] p-12 md:p-20 text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/10 to-transparent"></div>
                  <div className="relative z-10 space-y-8">
                     <FileText className="w-16 h-16 text-orange-600 mx-auto" />
                     <div className="space-y-4">
                        <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">EXERCISE YOUR RIGHTS</h2>
                        <p className="text-gray-400 font-medium max-w-xl mx-auto">You maintain absolute control. Request full data export, erasure, or restricted processing through our dedicated privacy gateway.</p>
                     </div>
                     <div className="pt-4">
                        <a href="mailto:privacy@rasan.com" className="inline-flex items-center justify-center bg-white text-black font-black uppercase tracking-[0.2em] h-16 px-10 rounded-2xl hover:bg-orange-600 hover:text-white transition-all text-xs">
                          Initialize Request: privacy@rasan.com
                        </a>
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
