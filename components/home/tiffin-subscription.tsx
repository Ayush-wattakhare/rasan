import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Calendar, Package, TrendingDown, Clock, CheckCircle, Star } from 'lucide-react';

interface TiffinSubscriptionProps {
  onSelectPlan?: (planType: 'daily' | 'weekly' | 'monthly') => void;
}

export default function TiffinSubscription({ onSelectPlan }: TiffinSubscriptionProps = {}) {
  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-white to-orange-50/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block mb-4 px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-semibold">
              🍱 Most Popular
            </div>
            <h2 className="mb-4 text-3xl md:text-4xl lg:text-5xl font-bold">
              Daily Tiffin Service &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
                Meal Subscriptions
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Perfect for students and working professionals! Get fresh, home-cooked meals delivered daily 
              at your doorstep. Save up to 30% with weekly and monthly plans.
            </p>
          </div>

          {/* Subscription Plans */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Daily Plan */}
            <Card className="border-2 hover:border-orange-300 transition-all hover:shadow-xl">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">🍱</div>
                  <h3 className="text-2xl font-bold mb-2">Daily Tiffin</h3>
                  <p className="text-muted-foreground text-sm mb-4">Order as you need</p>
                  <div className="text-3xl font-bold text-primary">₹80-120</div>
                  <p className="text-sm text-muted-foreground">per meal</p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Fresh home-cooked meals</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">2 rotis + sabzi + dal + rice</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Order anytime, no commitment</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Delivered in 30-45 mins</span>
                  </div>
                </div>

                {onSelectPlan ? (
                  <Button
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold"
                    size="lg"
                    onClick={() => onSelectPlan('daily')}
                  >
                    Order Now
                  </Button>
                ) : (
                  <Button className="w-full" size="lg" asChild>
                    <Link href="/meals">Order Now</Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Weekly Plan */}
            <Card className="border-2 border-orange-400 hover:border-orange-500 transition-all hover:shadow-xl relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-orange-500 text-white px-4 py-1 rounded-full text-xs font-bold">
                  SAVE 20%
                </div>
              </div>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">📅</div>
                  <h3 className="text-2xl font-bold mb-2">Weekly Plan</h3>
                  <p className="text-muted-foreground text-sm mb-4">7 days subscription</p>
                  <div className="text-3xl font-bold text-orange-600">₹560</div>
                  <p className="text-sm text-muted-foreground">₹80/meal (was ₹100)</p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">All daily tiffin benefits</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Fixed delivery time slot</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Menu variety every day</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Pause/skip anytime</span>
                  </div>
                </div>

                {onSelectPlan ? (
                  <Button
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold"
                    size="lg"
                    onClick={() => onSelectPlan('weekly')}
                  >
                    Subscribe Now
                  </Button>
                ) : (
                  <Button className="w-full bg-orange-600 hover:bg-orange-700" size="lg" asChild>
                    <Link href="/subscriptions?plan=weekly">Subscribe Now</Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Monthly Plan */}
            <Card className="border-2 border-green-400 hover:border-green-500 transition-all hover:shadow-xl relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-green-500 text-white px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  SAVE 30%
                </div>
              </div>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-3">🎁</div>
                  <h3 className="text-2xl font-bold mb-2">Monthly Plan</h3>
                  <p className="text-muted-foreground text-sm mb-4">30 days subscription</p>
                  <div className="text-3xl font-bold text-green-600">₹2,100</div>
                  <p className="text-sm text-muted-foreground">₹70/meal (was ₹100)</p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">All weekly plan benefits</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Priority delivery</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Dedicated home chef</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Free delivery</span>
                  </div>
                </div>

                {onSelectPlan ? (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                    size="lg"
                    onClick={() => onSelectPlan('monthly')}
                  >
                    Subscribe Now
                  </Button>
                ) : (
                  <Button className="w-full bg-green-600 hover:bg-green-700" size="lg" asChild>
                    <Link href="/subscriptions?plan=monthly">Subscribe Now</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardContent className="p-6 text-center">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Fixed Time Delivery</h3>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred time slot
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6 text-center">
                <Package className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Variety Menu</h3>
                <p className="text-sm text-muted-foreground">
                  Different dishes every day
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
              <CardContent className="p-6 text-center">
                <TrendingDown className="w-8 h-8 text-orange-600 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Best Prices</h3>
                <p className="text-sm text-muted-foreground">
                  Save up to 30% with plans
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-6 text-center">
                <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Flexible Plans</h3>
                <p className="text-sm text-muted-foreground">
                  Pause or cancel anytime
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl md:text-3xl font-bold mb-3">
                Perfect for Students & Working Professionals
              </h3>
              <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
                No more worrying about daily cooking or expensive restaurant food. 
                Get nutritious, home-style meals delivered to your PG, hostel, or office!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" className="text-lg" asChild>
                  <Link href="/meals?category=tiffin">
                    Browse Tiffin Options
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  className="text-lg bg-white text-orange-600 hover:bg-white/90"
                  asChild
                >
                  <Link href="/subscriptions">
                    View All Plans
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
