import type { Metadata } from 'next';
import KeyFeatures from '@/components/home/key-features';
import TiffinSubscription from '@/components/home/tiffin-subscription';
import HyperlocalDelivery from '@/components/home/hyperlocal-delivery';
import WomenEmpowerment from '@/components/home/women-empowerment';
import HowItWorks from '@/components/home/how-it-works';
import CTASection from '@/components/home/cta-section';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Heart, Users, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us — Rasan | Authentic Home-Cooked Meals',
  description:
    'Learn about Rasan — connecting food lovers with talented home chefs, empowering women entrepreneurs, and delivering authentic ghar ka khana across India.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <section
        className="relative py-20 md:py-32 text-white overflow-hidden isolate"
        style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #2d1a0e 60%, #FF5200 100%)' }}
      >
        {/* Background orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-orange-600/8 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
              </span>
              <span className="text-xs font-black text-orange-400 uppercase tracking-[0.2em]">Our Story</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] uppercase italic">
              ABOUT{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, #fb923c, #ef4444)' }}>
                RASAN
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              We're on a mission to bring the warmth of home-cooked meals to every doorstep — while empowering women
              home chefs to build thriving businesses from their own kitchens.
            </p>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10 max-w-xl mx-auto">
              {[
                { value: '500+', label: 'Home Chefs' },
                { value: '50K+', label: 'Meals Delivered' },
                { value: '4.9★', label: 'Avg Rating' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-black text-white">{s.value}</div>
                  <div className="text-[0.6rem] font-black text-gray-500 uppercase tracking-widest mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission Strip ── */}
      <section className="py-16 bg-[#FDFCFB]">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            {[
              {
                icon: Heart,
                color: 'text-red-500',
                bg: 'bg-red-50',
                title: 'Our Mission',
                desc: 'Make authentic home-cooked food accessible to everyone while creating economic opportunities for women.',
              },
              {
                icon: Users,
                color: 'text-purple-500',
                bg: 'bg-purple-50',
                title: 'Our Community',
                desc: 'A growing network of 500+ home chefs, thousands of happy customers, and dedicated delivery partners.',
              },
              {
                icon: MapPin,
                color: 'text-blue-500',
                bg: 'bg-blue-50',
                title: 'Our Reach',
                desc: 'Operating across 10+ Indian cities with hyperlocal delivery to your neighbourhood in under 45 minutes.',
              },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center gap-4">
                <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center`}>
                  <item.icon className={`w-7 h-7 ${item.color}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose Rasan + Stats bar ── */}
      <KeyFeatures />

      {/* ── Daily Tiffin & Subscription Plans ── */}
      <TiffinSubscription />

      {/* ── Hyperlocal Delivery ── */}
      <HyperlocalDelivery />

      {/* ── Women Empowerment ── */}
      <WomenEmpowerment />

      {/* ── How It Works ── */}
      <HowItWorks />

      {/* ── Join the Family CTA ── */}
      <CTASection />
    </div>
  );
}
