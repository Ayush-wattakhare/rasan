import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Clock, HelpCircle, Send, MessageSquareText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Rasan - Elite Support & Assistance',
  description: 'Get in touch with the Rasan elite support team. We provide round-the-clock assistance for customers, chefs, and partners.',
};

export default function ContactPage() {
  const contactMethods = [
    {
      icon: Mail,
      label: 'Email Support',
      val: 'support@rasan.com',
      desc: '24/7 dedicated assistance',
      color: 'bg-orange-50 text-orange-600'
    },
    {
      icon: Phone,
      label: 'Direct Line',
      val: '+91 999 000 1234',
      desc: 'Mon-Sat, 9AM to 9PM',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      icon: MessageSquareText,
      label: 'Live Chat',
      val: 'Available In-App',
      desc: 'Average response: 2 mins',
      color: 'bg-green-50 text-green-600'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* ── PREMIUM HERO ── */}
      <section className="relative overflow-hidden bg-[#1A1A1A] py-20 md:py-32">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
               <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
               <span className="text-[0.6rem] font-black text-white uppercase tracking-[0.3em] italic">Support Excellence Center</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase italic leading-[0.85]">
              WE ARE HERE <br />
              <span className="text-orange-600">TO HELP.</span>
            </h1>
            
            <p className="text-lg text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">
              Experience elite-level support. Whether you are a gourmand, a master chef, or a logistics partner, our team is standing by.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-16 relative z-20 pb-24">
        <div className="grid lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
          
          {/* ── CONTACT METHODS ── */}
          <div className="lg:col-span-4 space-y-4">
             {contactMethods.map((method, i) => (
                <Card key={i} className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden group hover:scale-105 transition-transform duration-500">
                   <CardContent className="p-8 flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform ${method.color}`}>
                         <method.icon className="w-7 h-7" />
                      </div>
                      <div>
                         <div className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest mb-1">{method.label}</div>
                         <div className="text-xl font-black text-gray-900 tracking-tight uppercase italic">{method.val}</div>
                         <div className="text-[0.7rem] font-bold text-gray-400 mt-1">{method.desc}</div>
                      </div>
                   </CardContent>
                </Card>
             ))}

             <Card className="border-none shadow-xl bg-orange-600 text-white rounded-[2rem] overflow-hidden p-8">
                <div className="space-y-4">
                   <MapPin className="w-10 h-10 opacity-50" />
                   <h3 className="text-2xl font-black uppercase italic tracking-tight">Main Hub</h3>
                   <p className="text-orange-100 font-bold text-sm leading-relaxed">
                      Level 12, Innovation Tower <br />
                      Tech Enclave, Bengaluru <br />
                      Karnataka, India
                   </p>
                   <div className="pt-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-200" />
                      <span className="text-[0.65rem] font-black uppercase tracking-widest">Always Active Online</span>
                   </div>
                </div>
             </Card>
          </div>

          {/* ── MESSAGE FORM ── */}
          <div className="lg:col-span-8">
            <Card className="border-none shadow-2xl bg-white rounded-[3rem] overflow-hidden h-full">
               <CardContent className="p-8 md:p-12">
                  <div className="mb-10 space-y-2">
                     <h2 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter">Secure Messaging</h2>
                     <p className="text-gray-400 font-medium">Encrypted communication channel to our support leads.</p>
                  </div>

                  <form className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400 ml-1">Full Identity</Label>
                        <Input id="name" placeholder="E.g. Alexander Pierce" className="rounded-2xl bg-gray-50 border-none h-14 font-bold text-gray-900 focus-visible:ring-orange-600 px-6" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400 ml-1">Digital Address</Label>
                        <Input id="email" type="email" placeholder="alex@example.com" className="rounded-2xl bg-gray-50 border-none h-14 font-bold text-gray-900 focus-visible:ring-orange-600 px-6" required />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400 ml-1">Inquiry Core</Label>
                      <Input id="subject" placeholder="What requires our attention?" className="rounded-2xl bg-gray-50 border-none h-14 font-bold text-gray-900 focus-visible:ring-orange-600 px-6" required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-[0.65rem] font-black uppercase tracking-widest text-gray-400 ml-1">Full Context</Label>
                      <textarea
                        id="message"
                        className="min-h-[200px] w-full rounded-3xl bg-gray-50 border-none p-6 font-medium text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 transition-all"
                        placeholder="Detail your inquiry for prioritized handling..."
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full bg-[#1A1A1A] hover:bg-orange-600 text-white font-black uppercase tracking-widest h-20 rounded-3xl shadow-xl transition-all group" size="lg">
                      <span className="mr-3">Initiate Transmission</span>
                      <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Button>
                  </form>
               </CardContent>
            </Card>
          </div>
        </div>

        {/* ── PRECISE FAQ ── */}
        <section className="mt-32 max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="mx-auto w-16 h-16 bg-orange-50 rounded-[1.5rem] flex items-center justify-center">
               <HelpCircle className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">INSTANT ANSWERS</h2>
            <div className="h-1.5 w-24 bg-orange-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { q: 'Order Tracking Logic', a: 'Check your high-fidelity dashboard for real-time telemetry.' },
              { q: 'Payment Protocols', a: 'We support all major secure gateways. Settlements are instant.' },
              { q: 'Partnership Tiers', a: 'Chefs and Delivery partners enjoy elite commission structures.' },
              { q: 'Technical Anomalies', a: 'Our engineers monitor the grid 24/7. Report issues via chat.' }
            ].map((faq, i) => (
              <Card key={i} className="border-none shadow-sm bg-white rounded-[2rem] p-8 hover:shadow-xl transition-all">
                <h3 className="text-xl font-black text-[#1A1A1A] mb-3 uppercase italic tracking-tight">{faq.q}</h3>
                <p className="text-gray-500 font-medium leading-relaxed">{faq.a}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
