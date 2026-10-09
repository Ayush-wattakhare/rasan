import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cookie, Settings, Shield, BarChart, Zap, EyeOff } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Telemetry Protocol - Rasan Cookie Policy',
  description: 'Our technical framework for ephemeral data and session orchestration.',
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* ── MINIMALIST HERO ── */}
      <section className="relative overflow-hidden bg-[#1A1A1A] py-20 md:py-32">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/5 rounded-full blur-[120px] -mr-32 -mt-32"></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
               <Cookie className="w-3.5 h-3.5 text-orange-500" />
               <span className="text-[0.6rem] font-black text-white uppercase tracking-[0.4em] italic">Telemetry Protocol</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-[0.9]">
              TRACKING <br />
              <span className="text-orange-600">MANIFEST.</span>
            </h1>
            
            <p className="text-sm font-bold text-gray-500 uppercase tracking-[0.3em]">Revision v.3.1 • Updated April 2024</p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-12 relative z-20 pb-32">
        <div className="max-w-4xl mx-auto">
          {/* ── INTRO ── */}
          <Card className="mb-12 border-none shadow-2xl bg-white rounded-[3rem] overflow-hidden">
            <CardContent className="p-10 md:p-16">
               <p className="text-xl text-gray-900 font-medium leading-relaxed italic">
                 "Rasan utilizes specialized tracking modules to orchestrate your session. This manifest details every ephemeral data point used to power your neighborhood experience."
               </p>
            </CardContent>
          </Card>

          {/* ── CORE MODULES ── */}
          <div className="space-y-12">
            {[
              {
                title: 'Operational Nodes (Essential)',
                icon: Shield,
                content: [
                  { h: 'Auth Flux', p: 'Maintains your active session state across the network. Disabling these breaks core account functionality.' },
                  { h: 'Secure Signal', p: 'Protects the network from malicious bots and fraudulent session injections.' },
                  { h: 'Fulfillment Cache', p: 'Temporarily stores your cart state and checkout parameters for seamless orchestration.' }
                ]
              },
              {
                title: 'Optimization Intel (Analytics)',
                icon: BarChart,
                content: [
                  { h: 'Spatial Telemetry', p: 'Aggregates anonymized navigation patterns to help us optimize regional kitchen discoverability.' },
                  { h: 'Performance Metrics', p: 'Logs mission-critical latency and error rates to maintain 99.9% network reliability.' },
                  { h: 'A/B Modules', p: 'Tests potential UI enhancements with specific network segments to refine the experience.' }
                ]
              },
              {
                title: 'Experience Customization',
                icon: Settings,
                content: [
                  { h: 'Preference persistence', p: 'Remembers your language, theme, and region to prevent redundant configuration.' },
                  { h: 'Predictive Indexing', p: 'Helps us suggest neighborhood kitchens based on your historical mission patterns.' }
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

            {/* ── CONTROL ── */}
            <section className="pt-8">
               <Card className="bg-[#1A1A1A] border-none rounded-[3.5rem] p-12 md:p-20 text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/10 to-transparent"></div>
                  <div className="relative z-10 space-y-8">
                     <EyeOff className="w-16 h-16 text-orange-600 mx-auto" />
                     <div className="space-y-4">
                        <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">DATA AUTONOMY</h2>
                        <p className="text-gray-400 font-medium max-w-xl mx-auto">You have the absolute right to restrict telemetry. Use our orchestration panel or your browser controls to manage nodes.</p>
                     </div>
                     <div className="pt-4 flex flex-wrap justify-center gap-4">
                        <Button className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest h-16 px-10 rounded-2xl shadow-xl transition-all">
                           Open Orchestration Panel
                        </Button>
                        <Button variant="outline" className="border-white/10 text-white hover:bg-white hover:text-black font-black uppercase tracking-widest h-16 px-10 rounded-2xl transition-all">
                           Standard Global Opt-Out
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
