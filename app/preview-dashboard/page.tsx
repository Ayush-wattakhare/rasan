import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  ShoppingBag,
  Calendar,
  Heart
} from 'lucide-react';
import TopMealsSection from '../(customer)/dashboard/top-meals-section';
import Link from 'next/link';

export default function PreviewDashboard() {
  // Mock meals for preview
  const topMeals: any[] = [
    {
      id: '1',
      name: 'Special Veg Thali',
      description: 'Complete meal with 3 types of sabzi, dal, rice, and 4 chapatis.',
      price: 150,
      rating: 4.8,
      image_url: null,
      is_veg: true,
      preparation_time: 30,
      vendor_id: 'v1',
      meal_type: 'lunch',
      category: 'Main Course',
      vendors: { business_name: "Mama's Kitchen", rating: 4.9 }
    },
    {
      id: '2',
      name: 'Paneer Butter Masala Combo',
      description: 'Paneer butter masala served with Jeera rice and salad.',
      price: 120,
      rating: 4.7,
      image_url: null,
      is_veg: true,
      preparation_time: 25,
      vendor_id: 'v2',
      meal_type: 'lunch',
      category: 'Main Course',
      vendors: { business_name: "Chef Rahul", rating: 4.7 }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Daily Homemade Tiffin Delivered 🏠
            </h1>
            <p className="text-lg md:text-xl mb-6 opacity-95">
              Fresh, healthy meals from local home chefs. Subscribe & save.
            </p>
            <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100 font-semibold shadow-lg">
              Subscribe Now
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for tiffin services, meals..."
              className="pl-12 pr-4 py-6 text-base rounded-xl border-gray-200 shadow-sm focus:shadow-md transition-shadow"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 min-w-max pb-2">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6">
              All Meals
            </Button>
            <Button variant="outline" className="rounded-full px-6 border-gray-300">
              Vegetarian
            </Button>
            <Button variant="outline" className="rounded-full px-6 border-gray-300">
              Non-Vegetarian
            </Button>
            <Button variant="outline" className="rounded-full px-6 border-gray-300">
              Breakfast
            </Button>
          </div>
        </div>

        {/* Top Rated Meals Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Top Rated Meals</h2>
              <div className="h-1 w-16 bg-orange-500 mt-2 rounded-full"></div>
            </div>
            <span className="text-orange-600 font-semibold flex items-center gap-1 cursor-pointer">
              View All <span>→</span>
            </span>
          </div>

          <TopMealsSection meals={topMeals} />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card className="border-0 shadow-md hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden group cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">My Orders</h3>
                  <p className="text-sm text-gray-600">Track your orders</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-xl transition-shadow bg-gradient-to-br from-green-50 to-green-100 overflow-hidden group cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Subscriptions</h3>
                  <p className="text-sm text-gray-600">Manage your plans</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-50 to-purple-100 overflow-hidden group cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Heart className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Favorites</h3>
                  <p className="text-sm text-gray-600">Your saved items</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
