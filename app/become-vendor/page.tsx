import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, DollarSign, Users, TrendingUp, Clock, Shield, Sparkles, ChefHat } from 'lucide-react';
import Link from 'next/link';
import VendorApplyButton from '@/components/partner/vendor-apply-button';

export const metadata: Metadata = {
  title: 'Partner with Rasan - Build Your Culinary Enterprise',
  description: 'Join Rasan as a vendor and start selling your homemade food to thousands of customers with zero upfront investment.',
};

export default function BecomeVendorPage() {
  const benefits = [
    {
      icon: DollarSign,
      title: 'Maximize Earnings',
      description: 'Set your own prices and keep 93% of every sale (only 7% platform fee). No entry fees or hidden cuts.',
      color: 'bg-green-50 text-green-600'
    },
    {
      icon: Users,
      title: 'Hyperlocal Reach',
      description: 'Connect with thousands of hungry neighbors looking for authentic homemade delicacies.',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      icon: Clock,
      title: 'Full Autonomy',
      description: 'You are the boss. Set your own hours, menu, and daily production limits with ease.',
      color: 'bg-orange-50 text-orange-600'
    },
    {
      icon: TrendingUp,
      title: 'Premium Analytics',
      description: 'Track your growth with our advanced vendor dashboard and customer insight tools.',
      color: 'bg-purple-50 text-purple-600'
    },
    {
      icon: Shield,
      title: 'Verified Safety',
      description: 'Get support with food safety certifications and join a community of verified master chefs.',
      color: 'bg-red-50 text-red-600'
    },
    {
      icon: Sparkles,
      title: 'Branding Support',
      description: 'Professional photography and menu design assistance to make your dishes stand out.',
      color: 'bg-cyan-50 text-cyan-600'
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Digital Application',
      description: 'Fill out our simple form with your kitchen details and signature menu concept.'
    },
    {
      number: '02',
      title: 'Kitchen Check',
      description: 'A quick virtual or physical verification to ensure safety and hygiene standards.'
    },
    {
      number: '03',
      title: 'Elite Onboarding',
      description: 'Set up your digital storefront, upload photos, and define your delivery zones.'
    },
    {
      number: '04',
      title: 'Live Launch',
      description: 'Go live on the Rasan app and start receiving your first neighborhood orders.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* ── PREMIUM HERO ── */}
      <section className="relative overflow-hidden bg-[#1A1A1A] py-20 md:py-32">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-[120px] -mr-48 -mt-48 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/10 rounded-full blur-[100px] -ml-32 -mb-32"></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
               <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></div>
               <span className="text-[0.65rem] font-black text-white uppercase tracking-[0.3em] italic">Open Enrollment Active</span>
            </div>
            
            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-[0.85] uppercase italic">
              TURN YOUR KITCHEN <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                INTO A LEGACY
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">
              Join the elite neighborhood of home chefs. Earn ₹15,000–₹50,000/month sharing your passion for authentic cooking.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
               <VendorApplyButton />
               <Button
                 size="lg"
                 variant="ghost"
                 className="border-2 border-white/20 bg-white/5 hover:bg-white/15 text-white hover:text-white font-black uppercase tracking-widest px-10 h-16 rounded-2xl backdrop-blur-md transition-all shadow-lg hover:border-white/40 cursor-pointer"
                 asChild
               >
                 <Link href="#how-it-works">Watch Process</Link>
               </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <div className="container mx-auto px-4 -mt-12 relative z-20">
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { val: '₹50k+', label: 'Potential Monthly' },
              { val: '93%', label: 'Your Share (7% Cut)' },
              { val: '0', label: 'Initial Cost' },
              { val: '24/7', label: 'Chef Support' }
            ].map((stat, i) => (
              <Card key={i} className="border-none shadow-xl bg-white rounded-3xl overflow-hidden group hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">{stat.val}</div>
                  <div className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest mt-1">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
         </div>
      </div>

      {/* ── BENEFITS ── */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
              WHY PARTNER WITH <span className="text-orange-600">RASAN?</span>
            </h2>
            <div className="h-1.5 w-24 bg-orange-600 mx-auto rounded-full"></div>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Empowering 500+ Local Entrepreneurs</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="group p-8 rounded-[2.5rem] bg-white border border-gray-100 shadow-sm hover:shadow-2xl smooth-transition hover:-translate-y-2">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform ${benefit.color}`}>
                  <benefit.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-3 uppercase italic tracking-tight">{benefit.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 md:py-32 bg-[#1A1A1A] text-white overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-5 pointer-events-none">
           <ChefHat className="w-full h-full rotate-12" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-xl mx-auto text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
              THE <span className="text-orange-600">ONBOARDING</span> JOURNEY
            </h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Transform in just 48-72 Hours</p>
          </div>

          <div className="grid md:grid-cols-4 gap-12 max-w-7xl mx-auto">
            {steps.map((step) => (
              <div key={step.number} className="relative group">
                <div className="text-7xl font-black text-white/5 absolute -top-10 -left-6 group-hover:text-orange-600/10 transition-colors">{step.number}</div>
                <div className="relative pt-6">
                   <h3 className="text-xl font-black mb-4 uppercase italic tracking-tighter text-orange-500">{step.title}</h3>
                   <p className="text-gray-400 font-medium leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REQUIREMENTS CHECK ── */}
      <section className="py-24 md:py-32 bg-[#FDFCFB]">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
             <div>
                <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] tracking-tighter uppercase italic mb-8">
                   ELITE <span className="text-orange-600">KITCHEN</span> STANDARDS
                </h2>
                <div className="space-y-6">
                   {[
                     'Valid government-issued identity proof',
                     'Proof of residential address / kitchen location',
                     'Hygiene-first cooking environment',
                     'Minimum 5 signature dishes for initial menu',
                     'Active smartphone for order management',
                     'FSSAI certification (assistance provided if needed)'
                   ].map((item, i) => (
                     <div key={i} className="flex items-center gap-4 group">
                        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                           <CheckCircle className="w-4 h-4 text-orange-600 group-hover:text-white" />
                        </div>
                        <span className="font-black text-gray-700 uppercase tracking-tight text-sm">{item}</span>
                     </div>
                   ))}
                </div>
             </div>
             
             <div className="relative">
                <div className="absolute -inset-4 bg-orange-600/5 rounded-[3rem] blur-3xl"></div>
                <Card className="relative bg-white border-none shadow-2xl rounded-[3rem] p-10 overflow-hidden">
                   <div className="relative z-10 text-center space-y-6">
                      <div className="mx-auto w-20 h-20 bg-orange-50 rounded-[2rem] flex items-center justify-center">
                         <ChefHat className="w-10 h-10 text-orange-600" />
                      </div>
                      <h3 className="text-2xl font-black text-[#1A1A1A] uppercase italic">Ready to cook?</h3>
                      <p className="text-gray-400 font-medium">Join 500+ neighborhood entrepreneurs making an impact.</p>
                      <VendorApplyButton />
                   </div>
                   {/* Abstract background logo */}
                   <div className="absolute -right-10 -bottom-10 opacity-[0.03]">
                      <ChefHat className="w-64 h-64" />
                   </div>
                </Card>
             </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl md:text-6xl font-black text-[#1A1A1A] tracking-tighter uppercase italic mb-8">
            YOUR CULINARY <br />
            <span className="text-orange-600">EMPIRE AWAITS.</span>
          </h2>
          <VendorApplyButton />
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-8 flex items-center justify-center gap-2">
            Built for neighborhood excellence <Sparkles className="w-4 h-4 text-orange-500" /> Powered by Rasan
          </p>
        </div>
      </section>
    </div>
  );
}
