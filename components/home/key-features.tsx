import { Card, CardContent } from '@/components/ui/card';
import { Users, MapPin, Heart, Shield, TrendingUp, Clock } from 'lucide-react';

const features = [
  {
    icon: Heart,
    title: 'Home-Cooked Quality',
    description: 'Authentic ghar ka khana made with love by local homemakers',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
  },
  {
    icon: Users,
    title: 'Women Empowerment',
    description: 'Supporting homemakers to earn ₹15,000-50,000/month with zero investment',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
  {
    icon: MapPin,
    title: 'Hyperlocal Delivery',
    description: 'Fresh meals from your neighborhood with live tracking & auto-assignment',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    icon: Shield,
    title: 'Safe & Hygienic',
    description: 'All home chefs verified with food safety certifications',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  {
    icon: TrendingUp,
    title: 'Affordable Pricing',
    description: 'Home-style meals at prices lower than restaurants',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
  },
  {
    icon: Clock,
    title: 'Flexible Options',
    description: 'One-time orders, subscriptions, or group ordering for offices',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
  },
];

export default function KeyFeatures() {
  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-orange-50/50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 md:mb-12 text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold">
            Why Choose Rasan?
          </div>
          <h2 className="mb-3 md:mb-4 text-2xl md:text-3xl lg:text-4xl font-bold">
            More Than Just Food Delivery
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            We're building a community that connects food lovers with talented home chefs, 
            empowering women and supporting local neighborhoods
          </p>
        </div>

        <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20">
              <CardContent className="p-6">
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${feature.bgColor}`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="mb-2 text-lg md:text-xl font-bold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-12 md:mt-16 rounded-2xl p-8 md:p-12 text-white" style={{ background: 'linear-gradient(to right, #FF5200, #f97316)' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">500+</div>
              <div className="text-sm md:text-base opacity-90">Women Entrepreneurs</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">50k+</div>
              <div className="text-sm md:text-base opacity-90">Happy Customers</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">10+</div>
              <div className="text-sm md:text-base opacity-90">Cities Covered</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">₹25L+</div>
              <div className="text-sm md:text-base opacity-90">Earned by Home Chefs</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
