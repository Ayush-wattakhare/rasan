import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, CheckCircle2, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Accessibility Commitment — Rasan',
  description: 'Our commitment to inclusive, accessible, and barrier-free digital dining for every member of the Rasan community.',
};

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-[#1A1A1A] py-20 md:py-32">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px] -mr-32 -mt-32" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <Eye className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-[0.6rem] font-black text-white uppercase tracking-[0.4em] italic">Universal Access</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-[0.9]">
              ACCESSIBILITY <br />
              <span className="text-orange-600">FOR ALL.</span>
            </h1>

            <p className="text-sm font-bold text-gray-500 uppercase tracking-[0.3em]">
              WCAG 2.1 AA Standard Compliance • Inclusive Experience
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-12 relative z-20 pb-32">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* ── MISSION CARD ── */}
          <Card className="border-none shadow-2xl bg-white rounded-[3rem] overflow-hidden">
            <CardContent className="p-10 md:p-16 space-y-6">
              <div className="flex items-center gap-3 text-orange-600">
                <HeartHandshake className="w-6 h-6" />
                <span className="text-xs font-black uppercase tracking-widest">Our Inclusive Mission</span>
              </div>
              <p className="text-xl text-gray-900 font-medium leading-relaxed italic">
                &quot;Rasan believes that access to wholesome, home-cooked food should be universal. We are dedicated to ensuring our platform is welcoming, usable, and accessible to everyone, regardless of ability or assistive technology.&quot;
              </p>
            </CardContent>
          </Card>

          {/* ── CORE PILLARS ── */}
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'High Contrast & Typography',
                desc: 'Carefully curated contrast ratios (WCAG AA), scalable typography, and clear visual hierarchy for effortless reading.',
                icon: Eye,
              },
              {
                title: 'Keyboard Navigable',
                desc: 'Full navigation support using keyboards and screen devices without requiring precision mouse control.',
                icon: Sparkles,
              },
              {
                title: 'Screen Reader Friendly',
                desc: 'Semantic HTML5 structure, descriptive alt attributes, and ARIA labels for seamless screen-reading assistance.',
                icon: ShieldCheck,
              },
              {
                title: 'Clean Focus States',
                desc: 'Unambiguous visual indicators on interactive buttons, inputs, and modals across both mobile and desktop views.',
                icon: CheckCircle2,
              },
            ].map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-gray-100 space-y-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tight">{pillar.title}</h3>
                  <p className="text-sm text-gray-600 font-medium leading-relaxed">{pillar.desc}</p>
                </div>
              );
            })}
          </div>

          {/* ── FEEDBACK ASSISTANCE ── */}
          <div className="bg-[#1A1A1A] p-10 md:p-14 rounded-[3rem] text-center space-y-6 text-white">
            <h3 className="text-3xl font-black uppercase italic tracking-tight">Need Assistance?</h3>
            <p className="text-gray-400 text-sm max-w-xl mx-auto leading-relaxed">
              If you experience any barriers accessing any part of Rasan, please reach out directly to our team. We continuously refine and test our interfaces based on your input.
            </p>
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl"
              >
                Contact Accessibility Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
