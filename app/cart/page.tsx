'use client';

import { useRouter } from 'next/navigation';
import { ShoppingCart, ArrowLeft, Plus, Minus, Sparkles, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/lib/hooks/use-cart';
import { CartItem } from '@/components/cart/cart-item';
import { CartSummary } from '@/components/cart/cart-summary';

export default function CartPage() {
  const router = useRouter();
  const { cart, updateQuantity, updateItemOptions, removeItem, clearCart, isLoading } = useCart();

  const handleCheckout = () => {
    router.push('/checkout');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest animate-pulse">Syncing Bag...</p>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto border border-gray-50">
            <ShoppingCart className="h-8 w-8 text-gray-200" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-[#1A1A1A] uppercase italic">Your Bag is Empty</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
              Explore authentic home kitchens near you.
            </p>
          </div>
          <Button 
            size="lg" 
            onClick={() => router.push('/meals')}
            className="bg-orange-600 hover:bg-[#1A1A1A] text-white px-10 h-16 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl transition-all duration-500 scale-100 hover:scale-105 active:scale-95"
          >
            Explore Meals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] py-12 md:py-20 lg:pb-32">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Simplified Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="space-y-4">
             <Button
                variant="ghost"
                onClick={() => router.push('/meals')}
                className="p-0 hover:bg-transparent text-gray-400 hover:text-orange-600 font-bold uppercase tracking-widest text-[0.6rem] flex items-center gap-2 group transition-colors"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Meals
             </Button>
             <h1 className="text-4xl md:text-5xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
               Shopping <span className="text-gray-200">Bag</span>
             </h1>
          </div>
          <p className="text-xs font-black text-orange-600 uppercase tracking-widest border-b-2 border-orange-600 pb-1 italic">
            {cart.items.length} {cart.items.length === 1 ? 'Item' : 'Items'} Reserved
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          {/* Cart Items - Simplified & Clean */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              {cart.items.map((item) => (
                <CartItem
                  key={`${item.meal_id}-${item.subscription_type}`}
                  item={item}
                  onUpdateQuantity={(quantity) =>
                    updateQuantity(item.meal_id, quantity, item.subscription_type)
                  }
                  onUpdateOptions={(updates) => 
                    updateItemOptions(item.meal_id, item.subscription_type, updates)
                  }
                  onRemove={() => removeItem(item.meal_id, item.subscription_type)}
                />
              ))}
            </div>

            <div className="flex items-center justify-between p-8 rounded-3xl bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <ChefHat className="w-8 h-8 text-orange-600" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Direct support for <span className="text-[#1A1A1A] font-black">Home Entrepreneurs</span>
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={clearCart}
                className="text-[0.6rem] font-black uppercase tracking-widest text-gray-300 hover:text-red-500 transition-all"
              >
                Clear Bag
              </Button>
            </div>
          </div>

          {/* Sticky Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <CartSummary
                subtotal={cart.subtotal}
                baseSubtotal={cart.base_subtotal}
                totalSavings={cart.total_savings}
                platformFee={cart.platform_fee}
                deliveryFee={cart.delivery_fee}
                total={cart.total}
                onCheckout={handleCheckout}
                checkoutLabel="Checkout Now"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
