import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, User, ArrowRight, Tag, Bookmark, Share2, Zap } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'The Rasan Journal - Chronicles of Home Cooking',
  description: 'Explore the latest culinary trends, chef stories, and neighborhood insights from the Rasan community.',
};

export default function BlogPage() {
  const featuredPost = {
    title: 'The Economics of the Modern Home Kitchen',
    excerpt: 'How homemakers are transforming local economies by digitizing traditional family recipes and reaching a global audience.',
    author: 'Elena Rossi',
    date: 'April 18, 2024',
    category: 'Analysis',
    image: '📊',
    readTime: '12 min read',
  };

  const blogPosts = [
    {
      title: 'Packaging the Future: Zero Waste Logistics',
      excerpt: 'Our roadmap to 100% sustainable delivery systems by the end of 2024.',
      author: 'Marcus Thorne',
      date: 'April 15, 2024',
      category: 'Innovation',
      image: '🌱',
      readTime: '6 min read',
    },
    {
      title: 'Masterclass: The Art of Slow Cooking',
      excerpt: 'Chef Malini shares the secrets behind her 12-hour marinated signature lamb.',
      author: 'Chef Malini',
      date: 'April 12, 2024',
      category: 'Recipes',
      image: '🥘',
      readTime: '8 min read',
    },
    {
      title: 'Partner Spotlight: The Spices of Lucknow',
      excerpt: 'Journeying through the hidden spice markets that power our most authentic dishes.',
      author: 'Rohan Gupta',
      date: 'April 10, 2024',
      category: 'Heritage',
      image: '🌶️',
      readTime: '10 min read',
    }
  ];

  const categories = ['All Journals', 'Market Insights', 'Chef Masterclass', 'Partner Log', 'Heritage', 'Sustainability'];

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* ── EDITORIAL HERO ── */}
      <section className="relative overflow-hidden bg-[#1A1A1A] py-24 md:py-36">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[150px] -mr-48 -mt-48"></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
               <Zap className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
               <span className="text-[0.6rem] font-black text-white uppercase tracking-[0.4em] italic">The Rasan Journal</span>
            </div>
            
            <h1 className="text-6xl md:text-9xl font-black text-white tracking-tighter leading-[0.8] uppercase italic">
              CHRONICLES OF <br />
              <span className="text-orange-600">CUISINE.</span>
            </h1>
            
            <p className="text-xl text-gray-400 font-medium leading-relaxed max-w-2xl mx-auto pt-4">
              Deep dives into the science of taste, the art of entrepreneurship, and the heart of neighborhood communities.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-12 relative z-20 pb-32">
        {/* ── CATEGORY FILTER ── */}
        <div className="flex flex-wrap gap-3 justify-center mb-16">
          {categories.map((cat, i) => (
            <Button key={i} variant="outline" className={`rounded-full px-8 h-12 font-black uppercase tracking-widest text-[0.65rem] border-none shadow-xl ${i === 0 ? 'bg-orange-600 text-white' : 'bg-white text-gray-900 hover:bg-orange-50'}`}>
              {cat}
            </Button>
          ))}
        </div>

        {/* ── FEATURED STORY ── */}
        <Card className="mb-20 border-none shadow-2xl bg-white rounded-[4rem] overflow-hidden group">
          <div className="grid lg:grid-cols-2">
            <div className="bg-[#FAFAF9] flex items-center justify-center p-20 relative overflow-hidden">
               <div className="text-[12rem] relative z-10 group-hover:scale-110 transition-transform duration-700">{featuredPost.image}</div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-600/5 rounded-full blur-3xl"></div>
            </div>
            <div className="p-12 md:p-20 flex flex-col justify-center space-y-8">
               <div className="flex items-center justify-between">
                  <div className="inline-flex px-4 py-1.5 rounded-full bg-orange-50 text-orange-600 text-[0.6rem] font-black uppercase tracking-[0.2em]">{featuredPost.category}</div>
                  <div className="flex gap-4">
                     <button className="text-gray-300 hover:text-orange-600"><Bookmark className="w-5 h-5" /></button>
                     <button className="text-gray-300 hover:text-orange-600"><Share2 className="w-5 h-5" /></button>
                  </div>
               </div>
               <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] leading-[0.9] uppercase italic tracking-tighter">{featuredPost.title}</h2>
               <p className="text-lg text-gray-500 font-medium leading-relaxed">{featuredPost.excerpt}</p>
               <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white font-black italic">ER</div>
                     <span className="text-sm font-black text-gray-900 uppercase italic tracking-tight">{featuredPost.author}</span>
                  </div>
                  <div className="text-[0.65rem] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                     <Calendar className="w-3.5 h-3.5" /> {featuredPost.date}
                  </div>
                  <div className="text-[0.65rem] font-black text-orange-600 uppercase tracking-widest">{featuredPost.readTime}</div>
               </div>
               <Button className="w-fit bg-[#1A1A1A] hover:bg-orange-600 text-white font-black uppercase tracking-widest h-16 px-10 rounded-2xl shadow-xl transition-all group">
                 Open Journal <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
               </Button>
            </div>
          </div>
        </Card>

        {/* ── GRID ── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, i) => (
            <Card key={i} className="border-none shadow-sm hover:shadow-2xl transition-all duration-500 bg-white rounded-[3rem] overflow-hidden group">
               <div className="bg-[#F8F8F7] py-20 flex items-center justify-center relative">
                  <div className="text-7xl z-10 group-hover:scale-110 transition-transform duration-500">{post.image}</div>
               </div>
               <CardContent className="p-10 space-y-6">
                  <div className="flex items-center justify-between">
                     <span className="text-[0.6rem] font-black text-orange-600 uppercase tracking-[0.2em]">{post.category}</span>
                     <span className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest">{post.readTime}</span>
                  </div>
                  <h3 className="text-2xl font-black text-[#1A1A1A] uppercase italic leading-tight tracking-tighter">{post.title}</h3>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">{post.excerpt}</p>
                  <Button variant="link" className="p-0 h-auto text-gray-900 hover:text-orange-600 font-black uppercase tracking-widest text-[0.65rem] group">
                    Continue Reading <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
               </CardContent>
            </Card>
          ))}
        </div>

        {/* ── NEWSLETTER ── */}
        <Card className="mt-32 border-none shadow-[0_50px_100px_rgba(0,0,0,0.05)] bg-[#1A1A1A] rounded-[4rem] overflow-hidden p-12 md:p-20 text-center relative">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-orange-600/10 to-transparent"></div>
           <div className="relative z-10 max-w-2xl mx-auto space-y-10">
              <div className="space-y-4">
                 <h2 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-[0.9]">THE WEEKLY <br /> <span className="text-orange-600">TRANSMISSION</span></h2>
                 <p className="text-gray-400 font-medium">Join 25k+ gourmands and entrepreneurs. Get the most important stories curated by our editors once a week.</p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                 <input type="email" placeholder="Enter your email for the mission" className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-8 h-18 text-white focus:outline-none focus:ring-2 focus:ring-orange-600 transition-all font-bold" />
                 <Button className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest h-18 px-12 rounded-2xl shadow-xl transition-all">Subscribe</Button>
              </div>
              <p className="text-[0.6rem] font-bold text-gray-500 uppercase tracking-widest">Reserved for high-agency individuals only • Opt-out anytime</p>
           </div>
        </Card>
      </div>
    </div>
  );
}
