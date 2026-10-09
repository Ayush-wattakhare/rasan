'use client';

import { ShoppingCart, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useCart } from '@/lib/hooks/use-cart';
import { CartItem } from './cart-item';
import { ScrollArea } from '@/components/ui/scroll-area';

export function CartDrawer() {
  const router = useRouter();
  const { cart, updateQuantity, updateItemOptions, removeItem, clearCart, itemCount } = useCart();

  const handleCheckout = () => {
    router.push('/checkout');
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center font-medium">
              {itemCount > 9 ? '9+' : itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col" {...({} as any)}>
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
          <SheetDescription>
            {itemCount === 0
              ? 'Your cart is empty'
              : `${itemCount} ${itemCount === 1 ? 'item' : 'items'} in your cart`}
          </SheetDescription>
        </SheetHeader>

        {cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Your cart is empty</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add some delicious meals to get started
            </p>
            <Button onClick={() => router.push('/meals')}>Browse Meals</Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-0">
                {cart.items.map((item) => (
                    <CartItem
                      key={item.meal_id}
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
            </ScrollArea>

            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Subtotal</span>
                <span className="text-lg font-bold">
                  ₹{cart.subtotal.toFixed(2)}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={clearCart}
                >
                  Clear Cart
                </Button>
                <Button className="flex-1" onClick={handleCheckout}>
                  Checkout
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Delivery fee and taxes calculated at checkout
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
