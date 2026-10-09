import Hero from '@/components/home/hero';
import FeaturedMeals from '@/components/home/featured-meals';
import PopularVendors from '@/components/home/popular-vendors';
import HowItWorks from '@/components/home/how-it-works';
import TiffinSubscription from '@/components/home/tiffin-subscription';
import HyperlocalDelivery from '@/components/home/hyperlocal-delivery';
import WomenEmpowerment from '@/components/home/women-empowerment';
import CTASection from '@/components/home/cta-section';
import Link from 'next/link';
import { ArrowRight, Info } from 'lucide-react';
import { Suspense } from 'react';

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      
      <div className="space-y-0">
        <Suspense fallback={
          <div className="py-12 bg-background-secondary text-center">
            <div className="container mx-auto px-4 max-w-6xl animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded-lg w-48 mx-auto" />
              <div className="h-4 bg-gray-100 rounded w-72 mx-auto" />
            </div>
          </div>
        }>
          <FeaturedMeals />
        </Suspense>

        <HowItWorks />
        <TiffinSubscription />

        <Suspense fallback={
          <div className="py-12 bg-white text-center">
            <div className="container mx-auto px-4 max-w-6xl animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded-lg w-48 mx-auto" />
              <div className="h-4 bg-gray-100 rounded w-72 mx-auto" />
            </div>
          </div>
        }>
          <PopularVendors />
        </Suspense>
        <HyperlocalDelivery />
        <WomenEmpowerment />
        
        {/* ── About Us CTA ── */}
        <section className="py-24 md:py-32 flex flex-col items-center justify-center text-center bg-white relative overflow-hidden isolate">
          {/* Soft glowing orbs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, #FF5200 0%, transparent 70%)' }} />

          <div className="relative z-10 flex flex-col items-center gap-8 px-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-[0.6rem] font-black uppercase tracking-[0.2em]">
              <Info className="w-3.5 h-3.5" />
              Intelligence Briefing
            </div>

            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-[#1A1A1A] tracking-tighter max-w-2xl leading-[0.9] uppercase italic">
              EXPLORE OUR <br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, #FF5200, #ec4899)' }}>
                CORE ARCHITECTURE
              </span>
            </h2>

            <p className="text-sm sm:text-base text-gray-400 max-w-md font-bold uppercase tracking-widest leading-relaxed">
              Discover our mission, how we empower home chefs, our hyperlocal delivery system, and everything that makes Rasan special.
            </p>

            <Link
              href="/about"
              className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-2xl text-white font-black text-sm uppercase tracking-widest shadow-2xl hover:shadow-orange-500/40 transition-all duration-500 hover:scale-105 active:scale-95 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #1A1A1A, #333333)' }}
            >
              {/* Shine sweep */}
              <span className="absolute inset-0 rounded-2xl overflow-hidden">
                <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </span>
              <span className="relative z-10">Access Dossier</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300 text-orange-500" />
            </Link>
          </div>
        </section>

        <CTASection />
      </div>
    </div>
  );
}
