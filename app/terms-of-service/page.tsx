import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Gavel, Scale, ShieldCheck, FileSignature, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Network Charter - Rasan Terms of Service',
  description: 'The governance framework for the Rasan neighborhood community network.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* ── MINIMALIST HERO ── */}
      <section className="relative overflow-hidden bg-[#1A1A1A] py-20 md:py-32">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/5 rounded-full blur-[120px] -mr-32 -mt-32"></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
               <Gavel className="w-3.5 h-3.5 text-orange-500" />
               <span className="text-[0.6rem] font-black text-white uppercase tracking-[0.4em] italic">Governance Charter</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-[0.9]">
              TERMS OF <br />
              <span className="text-orange-600">ENGAGEMENT.</span>
            </h1>
            
            <p className="text-sm font-bold text-gray-500 uppercase tracking-[0.3em]">Revision v.2.4 • Effective April 2024</p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-12 relative z-20 pb-32">
        <div className="max-w-4xl mx-auto">
          {/* ── INTRO ── */}
          <Card className="mb-12 border-none shadow-2xl bg-white rounded-[3rem] overflow-hidden">
            <CardContent className="p-10 md:p-16">
               <p className="text-xl text-gray-900 font-medium leading-relaxed italic">
                 "By entering the Rasan ecosystem, you agree to uphold our community standards of excellence, safety, and mutual respect. This charter outlines the operational boundaries for all network participants."
               </p>
            </CardContent>
          </Card>

          {/* ── CORE SECTIONS ── */}
          <div className="space-y-12">
            {[
              {
                id: 'eligibility',
                title: 'Network Eligibility',
                icon: ShieldCheck,
                content: [
                  { h: 'Standard Capacity', p: 'Participants must be 18+ with full legal agency to enter into binding digital contracts.' },
                  { h: 'Identity Verification', p: 'Accurate credentials are a prerequisite for all vendor and delivery corps memberships to ensure network safety.' },
                  { h: 'Regulatory Compliance', p: 'Users are responsible for maintaining compliance with their respective local jurisdiction laws.' }
                ]
              },
              {
                id: 'operations',
                title: 'Marketplace Protocol',
                icon: Zap,
                content: [
                  { h: 'Fulfillment Autonomy', p: 'Rasan acts as an orchestration layer. Actual culinary and logistical fulfillment is the sole responsibility of the respective partners.' },
                  { h: 'Transactional Integrity', p: 'Payments are processed through vaulted, PCI-compliant infrastructure. Chargebacks and refunds follow our specific Refund Protocol.' },
                  { h: 'Service Continuity', p: 'While we strive for 99.9% uptime, Rasan reserves the right to suspend nodes for maintenance or security audits.' }
                ]
              },
              {
                id: 'partnerships',
                title: 'Chef & Courier Ethics',
                icon: Scale,
                content: [
                  { h: 'Quality Sovereignty', p: 'Homemakers (Chefs) must maintain zero-compromise hygiene and safety standards as audited periodically by the network.' },
                  { h: 'Logistical Fidelity', p: 'Delivery partners are expected to prioritize food integrity and timely spatial fulfillment.' },
                  { h: 'Commission Structure', p: 'Standard network fees facilitate the continued expansion and technical superiority of the Rasan grid.' }
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

            {/* ── EXECUTION ── */}
            <section className="pt-8">
               <Card className="bg-[#1A1A1A] border-none rounded-[3.5rem] p-12 md:p-20 text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/10 to-transparent"></div>
                  <div className="relative z-10 space-y-8">
                     <FileSignature className="w-16 h-16 text-orange-600 mx-auto" />
                     <div className="space-y-4">
                        <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">LEGAL INQUIRIES</h2>
                        <p className="text-gray-400 font-medium max-w-xl mx-auto">For formal documentation requests or dispute resolution, contact our legal counsel directly.</p>
                     </div>
                     <div className="pt-4">
                        <a href="mailto:legal@rasan.com" className="inline-flex items-center justify-center bg-white text-black font-black uppercase tracking-[0.2em] h-16 px-10 rounded-2xl hover:bg-orange-600 hover:text-white transition-all text-xs">
                          Inquire: legal@rasan.com
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
