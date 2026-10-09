import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Sparkles, TrendingUp, Home, Clock, Users, Heart } from 'lucide-react';

export default function WomenEmpowerment() {
  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block mb-4 px-4 py-2 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold">
              <Sparkles className="w-4 h-4 inline mr-2" />
              Empowering Women Across India
            </div>
            <h2 className="mb-4 text-3xl md:text-4xl lg:text-5xl font-bold">
              Turn Your Cooking Skills Into{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Income
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Join 500+ homemakers who are earning ₹15,000-50,000 per month from home with zero investment. 
              Your kitchen, your rules, your income!
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="border-2 border-purple-100 hover:border-purple-300 transition-all">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                  <Home className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Work From Home</h3>
                <p className="text-muted-foreground">
                  No need to leave your home. Cook in your own kitchen and manage everything online.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-pink-100 hover:border-pink-300 transition-all">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-pink-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Zero Investment</h3>
                <p className="text-muted-foreground">
                  Start earning immediately with no upfront costs. Use your existing kitchen setup.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-100 hover:border-orange-300 transition-all">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Flexible Hours</h3>
                <p className="text-muted-foreground">
                  Set your own schedule. Cook when it suits you and manage family responsibilities.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-100 hover:border-blue-300 transition-all">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Supportive Community</h3>
                <p className="text-muted-foreground">
                  Join a network of women entrepreneurs supporting and learning from each other.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-100 hover:border-green-300 transition-all">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Ultra-Low 7% Commission</h3>
                <p className="text-muted-foreground">
                  Keep 93% of every sale. We believe in fair pricing for home chefs, taking only 7% vs 25-30% on traditional apps.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-indigo-100 hover:border-indigo-300 transition-all">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Marketing Support</h3>
                <p className="text-muted-foreground">
                  We handle customer acquisition, delivery, and payments. You focus on cooking!
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Success Story */}
          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 mb-8">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-5xl">
                    👩‍🍳
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="text-5xl mb-4">⭐⭐⭐⭐⭐</div>
                  <blockquote className="text-xl md:text-2xl font-medium mb-4">
                    "Rasan transformed my life! I now earn ₹25,000 per month while taking care of my family. 
                    The platform is so easy to use, and the support team is always there to help."
                  </blockquote>
                  <p className="text-lg opacity-90">
                    — Priya Sharma, Home Chef from Mumbai
                  </p>
                  <p className="text-sm opacity-75 mt-2">
                    Joined 8 months ago • 500+ orders completed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Start Your Journey?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join hundreds of women who have already started earning from home. 
              Registration is free and takes less than 5 minutes!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link href="/become-vendor">
                  Start Earning Today →
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                <Link href="/contact">
                  Talk to Our Team
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              ✓ No registration fees  ✓ Free training provided  ✓ 24/7 support
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
