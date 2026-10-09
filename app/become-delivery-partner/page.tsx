import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bike, 
  ShieldCheck, 
  Zap, 
  Clock, 
  DollarSign, 
  ChevronRight, 
  CheckCircle2, 
  MapPin, 
  Compass, 
  Award,
  PhoneCall,
  Smartphone,
  TrendingUp,
  Shield,
  Navigation
} from 'lucide-react';
import Link from 'next/link';
import DeliveryApplyButton from '@/components/partner/delivery-apply-button';

export const metadata: Metadata = {
  title: 'Elite Delivery Partner - Rasan Network',
  description: 'Earn on your terms with Rasan. Join the hyperlocal delivery revolution with competitive pay and full flexibility.',
};

export default function BecomeDeliveryPartnerPage() {
  const benefits = [
    {
      icon: DollarSign,
      title: 'Dominant Earnings',
      description: 'Earn industry-leading base pay plus keep 100% of your tips. Weekly automated settlements.',
      color: 'bg-emerald-50 text-emerald-600'
    },
    {
      icon: Clock,
      title: 'Infinite Flexibility',
      description: 'Zero minimum hours. Log in when you want, log out when you are done. Your life, your schedule.',
      color: 'bg-amber-50 text-amber-600'
    },
    {
      icon: MapPin,
      title: 'Hyperlocal Mastery',
      description: 'Deliver within specific neighborhood zones. Optimization reduces travel time and maximizes delivery count.',
      color: 'bg-rose-50 text-rose-600'
    },
    {
      icon: Smartphone,
      title: 'Precision App',
      description: 'Our proprietary partner app provides real-time route optimization and instant earning tracking.',
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      icon: TrendingUp,
      title: 'Peak Surge Pay',
      description: 'Earn 1.5x to 2x during lunch and dinner peaks. Dedicated bonuses for high-performance partners.',
      color: 'bg-cyan-50 text-cyan-600'
    },
    {
      icon: Shield,
      title: 'Network Security',
      description: 'Complimentary personal accident insurance and 24/7 on-ground emergency support.',
      color: 'bg-slate-50 text-slate-600'
    },
  ];

  const steps = [
    { number: '01', title: 'Flash Signup', desc: 'Secure digital application takes less than 3 minutes.' },
    { number: '02', title: 'Rapid Verif', desc: 'Document verification and background check in 24-48 hours.' },
    { number: '03', title: 'Equipment', desc: 'Receive your premium Rasan insulated kit and partner ID.' },
    { number: '04', title: 'Active Status', desc: 'Go live on the map and start accepting your first orders.' }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* ── HIGH PRECISISON HERO ── */}
      <section className="relative overflow-hidden bg-[#121212] py-24 md:py-36">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[150px] -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-600/5 rounded-full blur-[120px] -ml-32 -mb-32"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
               <Zap className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
               <span className="text-[0.6rem] font-bold text-white uppercase tracking-[0.4em] italic">Join the Elite Delivery Corps</span>
            </div>
            
            <h1 className="text-6xl md:text-9xl font-black text-white tracking-tighter leading-[0.8] uppercase italic">
              OWN THE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-red-600">
                STREETS.
              </span>
            </h1>
            
            <div className="flex flex-col md:flex-row items-start md:items-end gap-10 pt-4">
               <div className="flex-1 space-y-6">
                  <p className="text-xl text-gray-400 font-medium leading-relaxed max-w-xl">
                    Become a critical link in the neighborhood food chain. High-precision delivery, maximum freedom, and weekly payouts.
                  </p>
                  <div className="flex flex-wrap gap-4">
                     <DeliveryApplyButton />
                     <Button
                       size="lg"
                       variant="ghost"
                       className="border-2 border-white/20 bg-white/5 hover:bg-white/15 text-white hover:text-white font-black uppercase tracking-widest px-10 h-16 rounded-2xl backdrop-blur-md transition-all shadow-lg hover:border-white/40 cursor-pointer"
                       asChild
                     >
                       <Link href="#earnings">Calculate Pay</Link>
                     </Button>
                  </div>
               </div>
               
               <Card className="bg-white/5 border-white/10 backdrop-blur-xl border-none shadow-2xl rounded-[2.5rem] p-8 w-full md:w-80">
                  <div className="space-y-4 text-center">
                     <div className="text-[0.6rem] font-black text-orange-500 uppercase tracking-widest">Est. Weekly Earning</div>
                     <div className="text-5xl font-black text-white italic tracking-tighter">₹8,500+</div>
                     <p className="text-[0.65rem] text-gray-500 font-medium">Bases on 35 Peak Deliveries/Week in Urban Zones</p>
                  </div>
               </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ── PARTNER VALUE PROP ── */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20">
             <div className="max-w-2xl space-y-4 text-left">
                <div className="h-1.5 w-20 bg-orange-600 rounded-full"></div>
                <h2 className="text-5xl md:text-6xl font-black text-[#1A1A1A] tracking-tighter uppercase italic leading-[0.9]">
                  WHY THE BEST <br /> <span className="text-orange-600">DELIVER WITH US</span>
                </h2>
             </div>
             <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[0.65rem] pb-2">Superior Network Infrastructure</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="group p-10 rounded-[3rem] bg-white border border-gray-100 shadow-sm hover:shadow-2xl smooth-transition hover:-translate-y-2">
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all ${benefit.color}`}>
                  <benefit.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4 uppercase italic tracking-tighter">{benefit.title}</h3>
                <p className="text-gray-400 font-medium leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EARNINGS BREAKDOWN ── */}
      <section id="earnings" className="py-24 md:py-32 bg-[#1A1A1A] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
             <div className="space-y-8">
                <h2 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic leading-[0.9]">
                   THE SCIENCE OF <br /> <span className="text-orange-500 underline decoration-4 underline-offset-8">YOUR PAYOUT</span>
                </h2>
                <div className="space-y-6">
                   {[
                     { label: 'BASE PAY', val: 'Calculated by distance + effort complexity', icon: Navigation },
                     { label: 'SURGE BONUS', val: 'Peak hour multipliers during high demand', icon: Zap },
                     { label: 'TIPS', val: '100% of customer generosity is yours', icon: DollarSign },
                     { label: 'INCENTIVES', val: 'Milestone rewards for high delivery consistency', icon: TrendingUp }
                   ].map((item, i) => (
                     <div key={i} className="flex gap-6 group">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                           <item.icon className="w-5 h-5 text-gray-400 group-hover:text-white" />
                        </div>
                        <div>
                           <div className="text-[0.65rem] font-black text-orange-500 uppercase tracking-widest mb-1">{item.label}</div>
                           <p className="text-gray-400 font-medium">{item.val}</p>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
             
             <div className="relative">
                <div className="absolute -inset-10 bg-orange-600/10 rounded-full blur-[100px] animate-pulse"></div>
                <Card className="relative bg-white/5 border border-white/10 backdrop-blur-2xl px-8 py-12 rounded-[4rem] border-none">
                   <div className="space-y-10 text-center">
                      <div className="space-y-2">
                         <div className="text-[0.7rem] font-black tracking-[0.3em] uppercase text-gray-500">Peak Performance Example</div>
                         <div className="text-6xl font-black italic tracking-tighter text-white uppercase">₹2,850</div>
                         <div className="text-sm font-bold text-gray-400">Single Busy Sunday Session</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
                            <div className="text-[0.55rem] font-black text-gray-500 uppercase tracking-widest mb-1">Deliveries</div>
                            <div className="text-2xl font-black text-white italic">14</div>
                         </div>
                         <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
                            <div className="text-[0.55rem] font-black text-gray-500 uppercase tracking-widest mb-1">Avg Time</div>
                            <div className="text-2xl font-black text-white italic">22m</div>
                         </div>
                      </div>
                      
                      <Button size="lg" className="w-full bg-white text-black hover:bg-orange-600 hover:text-white font-black uppercase tracking-widest h-16 rounded-[2rem] shadow-2xl transition-all" asChild>
                         <Link href="/register?role=delivery">Secure Your Slot</Link>
                      </Button>
                   </div>
                </Card>
             </div>
          </div>
        </div>
      </section>

      {/* ── REQUIREMENTS ── */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
           <div className="max-w-4xl mx-auto text-center space-y-12">
              <div className="space-y-4">
                 <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">PARTNER CHECKLIST</h2>
                 <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Standard protocols for consistent excellence</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 text-left">
                 {[
                   'Minimum 18 years of age with valid ID',
                   'Active Android or iOS smartphone',
                   'Reliable vehicle (Car, Bike, Cycle, or Scooter)',
                   'Valid driving license & vehicle documents',
                   'Background verification clearance',
                   'Professionalism first attitude'
                 ].map((req, i) => (
                   <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-100">
                      <div className="w-6 h-6 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0">
                         <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                      <span className="font-extrabold text-gray-800 uppercase tracking-tight text-sm">{req}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-32 bg-[#121212] relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 text-center space-y-10">
          <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase italic leading-[0.85]">
            FUEL THE <br /> <span className="text-orange-600 underline decoration-8 underline-offset-10">REVOLUTION.</span>
          </h2>
          <div className="flex flex-col items-center gap-6">
             <DeliveryApplyButton />
             <p className="text-[0.65rem] font-bold text-gray-500 uppercase tracking-[0.4em] italic">Hyperlocal • Flexible • Premium Pay</p>
          </div>
        </div>
        
        {/* Animated Bike silhouette bg */}
        <div className="absolute bottom-10 right-0 opacity-[0.02] translate-x-1/4 pointer-events-none">
           <Bike className="w-[800px] h-[400px] -rotate-12" />
        </div>
      </section>
    </div>
  );
}
