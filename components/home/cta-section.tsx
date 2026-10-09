import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CTASection() {
  return (
    <section className="relative py-12 md:py-16 lg:py-20 text-white overflow-hidden isolate" style={{ background: 'linear-gradient(to right, #FF5200, #f97316, #ec4899)' }}>
      {/* Decorative floating food emojis */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl opacity-10">🍛</div>
        <div className="absolute top-20 right-20 text-6xl opacity-10">🥘</div>
        <div className="absolute bottom-20 left-1/4 text-6xl opacity-10">🍲</div>
        <div className="absolute bottom-10 right-1/3 text-6xl opacity-10">🥗</div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block mb-4 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
            🏠 Join the Rasan Family
          </div>
          <h2 className="mb-3 md:mb-4 text-2xl md:text-3xl lg:text-5xl font-bold">
            Missing Ghar Ka Khana?
          </h2>
          <p className="mb-6 md:mb-8 text-base md:text-lg lg:text-xl opacity-95 max-w-3xl mx-auto">
            Whether you're a student craving home-cooked meals, a homemaker wanting to earn, 
            or looking for flexible delivery work - Rasan has something for everyone!
          </p>
          
          <div className="grid sm:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl mb-2">🍽️</div>
              <h3 className="font-bold mb-1">For Food Lovers</h3>
              <p className="text-sm opacity-90">Authentic home-style meals</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl mb-2">👩‍🍳</div>
              <h3 className="font-bold mb-1">For Home Chefs</h3>
              <p className="text-sm opacity-90">Earn ₹15k-50k/month</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl mb-2">🏍️</div>
              <h3 className="font-bold mb-1">For Delivery Partners</h3>
              <p className="text-sm opacity-90">Earn ₹300-800/day</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center mb-8">
            <Button 
              size="lg" 
              className="w-full sm:w-auto min-w-[180px] bg-white text-orange-600 hover:bg-orange-50 hover:text-orange-700 font-bold text-lg shadow-lg border-2 border-white transition-all hover:scale-105" 
              asChild
            >
              <Link href="/meals">Order Now</Link>
            </Button>
            <Button 
              size="lg" 
              className="w-full sm:w-auto min-w-[180px] bg-orange-600 text-white hover:bg-orange-700 font-semibold text-lg shadow-lg border-2 border-white/30 transition-all hover:scale-105" 
              asChild
            >
              <Link href="/become-vendor">Become a Home Chef</Link>
            </Button>
            <Button 
              size="lg" 
              className="w-full sm:w-auto min-w-[180px] bg-pink-600 text-white hover:bg-pink-700 font-semibold text-lg shadow-lg border-2 border-white/30 transition-all hover:scale-105" 
              asChild
            >
              <Link href="/become-delivery-partner">Deliver & Earn</Link>
            </Button>
          </div>
          
          {/* Additional info */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-xs md:text-sm opacity-90">
            <div className="flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span>Zero investment for home chefs</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span>Real-time delivery tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span>Hyperlocal & fresh</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">✓</span>
              <span>Women empowerment</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
