import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  HelpCircle, 
  MessageSquare, 
  Phone, 
  Mail, 
  BookOpen, 
  Video,
  FileText,
  Users,
  Zap,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Partner Mission Control - Rasan Elite Support',
  description: 'World-class technical and operational support for Rasan chef partners and delivery corps.',
};

export default function PartnerSupportPage() {
  const channels = [
    { icon: MessageSquare, title: 'Priority Chat', desc: 'Average 2m wait time', note: '24/7/365 Active', color: 'bg-orange-50 text-orange-600' },
    { icon: Phone, title: 'Partner Hotline', desc: 'Direct line to leads', note: 'Mon-Sat, 9AM-9PM', color: 'bg-blue-50 text-blue-600' },
    { icon: Mail, title: 'Case Submission', desc: 'Complex technical issues', note: 'Response: < 4hrs', color: 'bg-indigo-50 text-indigo-600' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* ── MISSION CONTROL HERO ── */}
      <section className="relative overflow-hidden bg-[#1A1A1A] py-24 md:py-36">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[150px] -mr-48 -mt-48"></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
               <Zap className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
               <span className="text-[0.6rem] font-black text-white uppercase tracking-[0.4em] italic">Partner Mission Control</span>
            </div>
            
            <h1 className="text-6xl md:text-9xl font-black text-white tracking-tighter leading-[0.8] uppercase italic">
              COMMAND <br />
              <span className="text-orange-600">CENTRAL.</span>
            </h1>
            
            <p className="text-xl text-gray-400 font-medium leading-relaxed max-w-2xl mx-auto pt-4">
              Unrivaled operational support for the backbone of our community. Resolve technical anomalies, manage payouts, and scale your mission.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-16 relative z-20 pb-32">
        {/* ── PRIORITY CHANNELS ── */}
        <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto mb-24">
          {channels.map((ch, i) => (
            <Card key={i} className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden group hover:-translate-y-2 transition-all duration-500">
               <CardContent className="p-10 flex flex-col items-center text-center space-y-6">
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center group-hover:rotate-6 transition-transform ${ch.color}`}>
                     <ch.icon className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tight">{ch.title}</h3>
                     <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">{ch.desc}</p>
                     <div className="text-[0.6rem] font-black text-orange-600 uppercase tracking-[0.2em]">{ch.note}</div>
                  </div>
                  <Button className="w-full bg-[#1A1A1A] hover:bg-orange-600 text-white font-black uppercase tracking-widest h-14 rounded-2xl">Initialize</Button>
               </CardContent>
            </Card>
          ))}
        </div>

        {/* ── EMERGENCY TIER ── */}
        <Card className="max-w-5xl mx-auto border-none shadow-[0_30px_60px_rgba(239,68,68,0.15)] bg-white rounded-[3rem] overflow-hidden mb-24 relative group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl group-hover:bg-red-600/10 transition-colors"></div>
           <CardContent className="p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
              <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center shrink-0">
                 <ShieldAlert className="w-12 h-12 text-red-600 animate-pulse" />
              </div>
              <div className="flex-1 space-y-4">
                 <h2 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter">EMERGENCY PROTOCOL</h2>
                 <p className="text-gray-500 font-medium leading-relaxed">Safety is non-negotiable. If you are experiencing a critical on-ground safety incident or urgent medical emergency during a mission, trigger the hotline immediately.</p>
              </div>
              <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest h-18 px-10 rounded-2xl shadow-xl transition-all" asChild>
                 <a href="tel:+91911911911">Trigger Hotline</a>
              </Button>
           </CardContent>
        </Card>

        {/* ── DOCUMENTATION HUB ── */}
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12">
           <div className="lg:col-span-4 space-y-8">
              <div className="space-y-2">
                 <h2 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">VITAL RESOURCES</h2>
                 <p className="text-gray-400 font-medium">Self-service logistics & tech guides.</p>
              </div>
              <div className="space-y-4">
                 {[
                   { icon: BookOpen, title: 'Knowledge Base', count: '150+ Articles' },
                   { icon: Video, title: 'Masterclass Videos', count: '45 Modules' },
                   { icon: FileText, title: 'Compliance Docs', count: 'Standard Kit' },
                   { icon: Users, title: 'Partner Forum', count: 'Community Hub' }
                 ].map((res, i) => (
                    <div key={i} className="flex items-center justify-between p-6 rounded-3xl bg-white border border-gray-100 hover:border-orange-200 hover:shadow-xl transition-all group cursor-pointer">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                             <res.icon className="w-6 h-6 text-gray-400 group-hover:text-orange-600 transition-colors" />
                          </div>
                          <div>
                             <div className="text-sm font-black text-gray-900 uppercase italic tracking-tight">{res.title}</div>
                             <div className="text-[0.6rem] font-bold text-gray-400 uppercase tracking-widest">{res.count}</div>
                          </div>
                       </div>
                       <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                    </div>
                 ))}
              </div>
           </div>

           <div className="lg:col-span-8 bg-white border border-gray-100 rounded-[3rem] p-10 md:p-16 shadow-sm">
              <div className="mb-12 flex items-center justify-between">
                 <h2 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">INTEL CENTER (FAQ)</h2>
                 <div className="h-1.5 w-16 bg-orange-600 rounded-full"></div>
              </div>

              <div className="space-y-8">
                 {[
                   { q: 'When are payouts distributed?', a: 'Automated weekly settlements trigger every Sunday at 23:59. Funds usually reflect in your primary account within 24-48 hours.' },
                   { q: 'How do I handle an incorrect address?', a: 'Do not deviate from the GPS protocol. Use the "Address Discrepancy" trigger in the app to initiate instant client-partner-support conference call.' },
                   { q: 'Eligibility for surge earnings?', a: 'Surge tiers are unlocked during peak hours (12PM-2PM & 7PM-10PM) and in areas with >150% demand-to-partner ratio.' },
                   { q: 'System login anomalies?', a: 'Flush your app cache and verify your biometric token. If the issue persists, trigger the Tier-1 tech support channel above.' }
                 ].map((faq, i) => (
                    <div key={i} className="pb-8 border-b border-gray-50 last:border-0 last:pb-0">
                       <h3 className="text-xl font-black text-gray-900 uppercase italic mb-4 tracking-tight flex gap-4">
                          <span className="text-orange-600">Q.</span> {faq.q}
                       </h3>
                       <p className="text-gray-500 font-medium leading-relaxed pl-8 border-l-2 border-orange-50">
                          {faq.a}
                       </p>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* ── SUCCESS BANNER ── */}
        <section className="mt-32 p-12 md:p-20 bg-[#1A1A1A] rounded-[4rem] text-center relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 via-transparent to-indigo-600/10"></div>
           <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h2 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-[0.9]">DEDICATED <br /><span className="text-orange-600">SUCCESS</span> SQUAD</h2>
              <p className="text-gray-400 font-medium text-lg">We do not just support; we strategist. Join a consultation session with our Partner Growth team to double your neighborhood footprint.</p>
              <div className="flex flex-wrap justify-center gap-6">
                 <Button className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest h-20 px-12 rounded-[2.5rem] shadow-2xl transition-all">Schedule Strategy Call</Button>
                 <Button variant="outline" className="border-white/10 text-white hover:bg-white hover:text-black font-black uppercase tracking-widest h-20 px-12 rounded-[2.5rem] transition-all">View Training Grid</Button>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
}
