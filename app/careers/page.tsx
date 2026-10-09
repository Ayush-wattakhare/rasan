import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, TrendingUp, Heart, MapPin, Clock, Sparkles, ChevronRight, Zap } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Careers at Rasan - Build the Future of Food',
  description: 'Join the elite team at Rasan. We are building the world\'s most community-centric food network.',
};

export default function CareersPage() {
  const openPositions = [
    {
      title: 'Senior Systems Architect',
      department: 'Engineering',
      location: 'Bengaluru / Remote',
      type: 'Full-time',
      tag: 'High Priority'
    },
    {
      title: 'Product Lead, Experience',
      department: 'Product',
      location: 'Bengaluru, India',
      type: 'Full-time',
      tag: 'Strategic'
    },
    {
      title: 'Senior UI/UX Strategist',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time',
      tag: 'Design Elite'
    },
    {
      title: 'Growth Operations Manager',
      department: 'Marketing',
      location: 'Mumbai, India',
      type: 'Full-time',
      tag: 'Expansion'
    }
  ];

  const benefits = [
    {
      icon: Heart,
      title: 'Global Wellness',
      desc: 'Top-tier health coverage and mental wellness stipends.',
      color: 'bg-rose-50 text-rose-600'
    },
    {
      icon: TrendingUp,
      title: 'Equity & Growth',
      desc: 'Ownership in the mission with annual learning budgets.',
      color: 'bg-emerald-50 text-emerald-600'
    },
    {
      icon: Users,
      title: 'Elite Culture',
      desc: 'Work with the top 1% of talent in the food-tech space.',
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      icon: Sparkles,
      title: 'Invention Time',
      desc: 'Dedicated 10% time for experimental side projects.',
      color: 'bg-amber-50 text-amber-600'
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* ── TALENT HERO ── */}
      <section className="relative overflow-hidden bg-[#121212] py-24 md:py-40">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[150px] -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px] -ml-32 -mb-32"></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
               <Zap className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
               <span className="text-[0.6rem] font-black text-white uppercase tracking-[0.4em] italic">Building the Neighborhood Grid</span>
            </div>
            
            <h1 className="text-6xl md:text-9xl font-black text-white tracking-tighter leading-[0.8] uppercase italic">
              ENGINEER <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-red-600">
                EXCELLENCE.
              </span>
            </h1>
            
            <p className="text-xl text-gray-400 font-medium leading-relaxed max-w-2xl mx-auto pt-4">
              Help us revolutionize the way the world eats. We are assembling a team of visionaries to scale the neighborhood kitchen revolution.
            </p>

            <div className="flex justify-center pt-8">
               <Button size="lg" className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest px-12 h-20 rounded-3xl shadow-2xl transition-all hover:scale-105 active:scale-95" asChild>
                 <Link href="#openings">View Openings</Link>
               </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE VALUES ── */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20 space-y-4">
             <div className="h-1.5 w-20 bg-orange-600 mx-auto rounded-full"></div>
             <h2 className="text-5xl md:text-6xl font-black text-[#1A1A1A] tracking-tighter uppercase italic leading-[0.9]">
               WHY RASAN <span className="text-orange-600">ELITE</span>
             </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {benefits.map((benefit, i) => (
              <div key={i} className="group p-10 rounded-[3rem] bg-white border border-gray-100 shadow-sm hover:shadow-2xl transition-all hover:-translate-y-2">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform ${benefit.color}`}>
                  <benefit.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4 uppercase italic tracking-tight">{benefit.title}</h3>
                <p className="text-gray-400 font-medium leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OPENINGS GRID ── */}
      <section id="openings" className="py-24 md:py-32 bg-[#1A1A1A] text-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20">
               <div className="space-y-4 text-left">
                  <h2 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic leading-[0.9]">MISSION CATEGORIES</h2>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[0.65rem]">Currently accepting applications for Q2 Expansion</p>
               </div>
               <div className="hidden md:block h-px flex-1 bg-white/10 mx-10 mb-2"></div>
            </div>

            <div className="space-y-4">
              {openPositions.map((pos, i) => (
                <div key={i} className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600 to-red-600 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                  <Card className="relative bg-[#222] border-none text-white rounded-[2rem] overflow-hidden transition-all group-hover:bg-[#1A1A1A]">
                    <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                       <div className="space-y-3">
                          <div className="inline-flex px-3 py-1 rounded-full bg-orange-600/20 text-orange-500 border border-orange-600/30 text-[0.6rem] font-black uppercase tracking-widest">
                             {pos.tag}
                          </div>
                          <h3 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter">{pos.title}</h3>
                          <div className="flex flex-wrap gap-6 text-[0.7rem] font-bold text-gray-500 uppercase tracking-widest">
                             <span className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-orange-600" /> {pos.department}</span>
                             <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-orange-600" /> {pos.location}</span>
                             <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-orange-600" /> {pos.type}</span>
                          </div>
                       </div>
                       
                       <Button size="lg" className="bg-white text-black hover:bg-orange-600 hover:text-white font-black uppercase tracking-widest h-16 px-8 rounded-2xl transition-all" asChild>
                          <Link href={`mailto:careers@rasan.com?subject=Application for ${pos.title}`}>
                             Join Mission
                             <ChevronRight className="ml-2 w-5 h-5" />
                          </Link>
                       </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            <div className="mt-20 p-12 rounded-[3.5rem] bg-white/5 border border-white/10 text-center relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-orange-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <div className="relative z-10 space-y-6">
                  <h3 className="text-3xl font-black uppercase italic tracking-tight">GENERAL TRANSMISSION</h3>
                  <p className="text-gray-400 font-medium max-w-xl mx-auto">
                    Do not see your niche? Send us your credentials. We are always hiring polymaths and high-agency individuals who love food as much as they love technology.
                  </p>
                  <Button variant="outline" className="border-white/10 text-white hover:bg-white hover:text-black font-black uppercase tracking-widest h-14 px-10 rounded-full" asChild>
                    <Link href="mailto:careers@rasan.com?subject=General Application">Inquire about opportunities</Link>
                  </Button>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
           <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-black text-[#1A1A1A] text-center mb-16 uppercase italic tracking-tighter">THE ONBOARDING PROTOCOL</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                 {[
                   { n: '01', t: 'Selection', d: 'Resume & Portfolio review' },
                   { n: '02', t: 'Dialogue', d: 'Core mission alignment' },
                   { n: '03', t: 'Execution', d: 'Practical challenge' },
                   { n: '04', t: 'Arrival', d: 'Elite onboarding' }
                 ].map((step, i) => (
                   <div key={i} className="text-center group">
                      <div className="text-5xl font-black text-gray-100 mb-4 group-hover:text-orange-600 transition-colors">{step.n}</div>
                      <h4 className="text-lg font-black text-gray-900 uppercase italic mb-1">{step.t}</h4>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{step.d}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </section>
    </div>
  );
}
