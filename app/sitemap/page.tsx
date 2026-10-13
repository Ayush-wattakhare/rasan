import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Map, Compass, Utensils, Store, Bike, Shield, LifeBuoy, FileText } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Platform Sitemap — Rasan',
  description: 'Complete directory of all pages, services, partner networks, and legal resources across Rasan.',
};

const sitemapSections = [
  {
    title: 'Customer Experience',
    icon: Utensils,
    links: [
      { label: 'Explore Meals', href: '/meals', desc: 'Browse fresh, home-cooked daily menus' },
      { label: 'Home Kitchens', href: '/vendors', desc: 'Meet local verified home chefs' },
      { label: 'Subscription Plans', href: '/subscriptions', desc: 'Custom recurring lunch & dinner plans' },
      { label: 'Your Cart', href: '/cart', desc: 'Review selected items before checkout' },
      { label: 'Customer Dashboard', href: '/dashboard', desc: 'Active orders, history, and address settings' },
    ],
  },
  {
    title: 'Partner Ecosystem',
    icon: Store,
    links: [
      { label: 'Become a Home Chef', href: '/become-vendor', desc: 'Start your cloud kitchen with zero setup fees' },
      { label: 'Become a Delivery Partner', href: '/become-delivery-partner', desc: 'Join our hyperlocal delivery pilot fleet' },
      { label: 'Vendor Operations Hub', href: '/vendor-dashboard', desc: 'Kitchen prep hub, batch manifest & orders' },
      { label: 'Rider Command', href: '/delivery-dashboard', desc: 'Active trips, live navigation & earnings' },
      { label: 'Partner Support Desk', href: '/partner-support', desc: 'Dedicated escalation and assistance' },
    ],
  },
  {
    title: 'Company & Mission',
    icon: Compass,
    links: [
      { label: 'About Rasan', href: '/about', desc: 'Our mission to empower culinary artisans' },
      { label: 'Careers', href: '/careers', desc: 'Build the future of community dining' },
      { label: 'Culinary Journal & Blog', href: '/blog', desc: 'Stories, recipes, and home chef spotlights' },
      { label: 'Contact Us', href: '/contact', desc: 'Connect with our regional operations team' },
    ],
  },
  {
    title: 'Legal & Trust',
    icon: FileText,
    links: [
      { label: 'Terms of Service', href: '/terms-of-service', desc: 'Network governance and engagement rules' },
      { label: 'Privacy Policy', href: '/privacy-policy', desc: 'Data protection and transparency framework' },
      { label: 'Refund Policy', href: '/refund-policy', desc: 'Transparent cancellation and refund rules' },
      { label: 'Cookie Policy', href: '/cookie-policy', desc: 'Session and storage disclosures' },
      { label: 'Accessibility', href: '/accessibility', desc: 'Universal digital accessibility commitment' },
    ],
  },
];

export default function SitemapPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-[#1A1A1A] py-20 md:py-32">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px] -mr-32 -mt-32" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <Map className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-[0.6rem] font-black text-white uppercase tracking-[0.4em] italic">Platform Directory</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-[0.9]">
              NETWORK <br />
              <span className="text-orange-600">SITEMAP.</span>
            </h1>

            <p className="text-sm font-bold text-gray-500 uppercase tracking-[0.3em]">
              Comprehensive Navigation of the Rasan Community Hub
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-12 relative z-20 pb-32">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10">
          {sitemapSections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <Card key={idx} className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-8 md:p-10 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tight">{section.title}</h2>
                  </div>

                  <ul className="space-y-4">
                    {section.links.map((link, lIdx) => (
                      <li key={lIdx} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                        <Link
                          href={link.href}
                          className="group flex flex-col hover:text-orange-600 transition-colors"
                        >
                          <span className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                            {link.label} →
                          </span>
                          <span className="text-xs text-gray-500 mt-0.5">{link.desc}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
