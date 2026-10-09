import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation, Clock, Smartphone, CheckCircle, Zap } from 'lucide-react';

export default function HyperlocalDelivery() {
  return (
    <section className="py-12 md:py-16 lg:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-block mb-4 px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                <MapPin className="w-4 h-4 inline mr-2" />
                Hyperlocal Delivery
              </div>
              <h2 className="mb-4 text-3xl md:text-4xl lg:text-5xl font-bold">
                Fresh Food From Your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
                  Neighborhood
                </span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                We connect you with home chefs in your local area, ensuring the freshest meals 
                delivered quickly. Our smart delivery system uses live maps and auto-assignment 
                for the fastest possible delivery.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Real-Time Tracking</h3>
                    <p className="text-muted-foreground">
                      Track your delivery partner's location live on the map from pickup to your doorstep
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Navigation className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Smart Auto-Assignment</h3>
                    <p className="text-muted-foreground">
                      Orders automatically assigned to nearest delivery partner for fastest delivery
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">30-45 Min Delivery</h3>
                    <p className="text-muted-foreground">
                      Fresh, hot meals delivered within 30-45 minutes from your local neighborhood
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Live Updates</h3>
                    <p className="text-muted-foreground">
                      Get instant notifications at every step - order confirmed, preparing, out for delivery
                    </p>
                  </div>
                </div>
              </div>

              <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-1">Lightning Fast Delivery</h3>
                      <p className="text-sm text-muted-foreground">
                        Average delivery time: 35 minutes | 95% on-time delivery rate
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Visual */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-blue-100 to-cyan-100 rounded-3xl p-8 md:p-12">
                {/* Map Illustration */}
                <div className="bg-white rounded-2xl p-6 shadow-xl">
                  <div className="text-center mb-6">
                    <h3 className="font-bold text-xl mb-2">Live Delivery Tracking</h3>
                    <p className="text-sm text-muted-foreground">Your order is on the way!</p>
                  </div>

                  {/* Mock Map */}
                  <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-8 mb-6 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-1/4 left-1/4 w-32 h-32 border-2 border-blue-300 rounded-full"></div>
                      <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-green-300 rounded-full"></div>
                      <div className="absolute bottom-1/4 right-1/4 w-20 h-20 border-2 border-orange-300 rounded-full"></div>
                    </div>
                    
                    <div className="relative z-10 flex flex-col items-center justify-center h-48">
                      <div className="text-6xl mb-4 animate-bounce">🏍️</div>
                      <div className="bg-white px-4 py-2 rounded-full shadow-lg">
                        <p className="text-sm font-semibold">Arriving in 12 mins</p>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Steps */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Order Confirmed</p>
                        <p className="text-xs text-muted-foreground">2:30 PM</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Food Being Prepared</p>
                        <p className="text-xs text-muted-foreground">2:35 PM</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                        <Navigation className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Out for Delivery</p>
                        <p className="text-xs text-muted-foreground">2:50 PM</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 opacity-50">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Delivered</p>
                        <p className="text-xs text-muted-foreground">Expected: 3:05 PM</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 bg-white rounded-full p-4 shadow-xl">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white rounded-full p-4 shadow-xl">
                  <Clock className="w-8 h-8 text-green-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
