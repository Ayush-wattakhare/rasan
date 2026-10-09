'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Plus, Minus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/hooks/use-cart';
import { useAuth } from '@/lib/hooks/use-auth';
import { useToast } from '@/lib/hooks/use-toast';
import type { CartItem } from '@/types';

interface AddToCartButtonProps {
  meal: {
    id: string;
    vendor_id: string;
    name: string;
    price: number;
    image_url?: string | null;
    is_veg: boolean;
    is_available: boolean;
    stock?: number | null;
  };
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showQuantity?: boolean;
}

export function AddToCartButton({
  meal,
  variant = 'default',
  size = 'default',
  showQuantity = false,
}: AddToCartButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, addItem, updateQuantity } = useCart();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  // Check if meal is already in cart
  const cartItem = cart.items.find((item) => item.meal_id === meal.id);
  const quantity = cartItem?.quantity || 0;

  // Check if meal is available
  const isAvailable =
    meal.is_available && (meal.stock === null || meal.stock === undefined || meal.stock > 0);

  const requireAuthRedirect = () => {
    toast({
      title: 'Login Required',
      description: 'Please sign in or register to add meals to your cart. Delivery cannot be done without an account.',
      variant: 'destructive',
    });
    const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/meals';
    router.push(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
  };

  const handleAddToCart = async () => {
    if (!user) {
      requireAuthRedirect();
      return;
    }

    if (!isAvailable) {
      toast({
        title: 'Unavailable',
        description: 'This meal is currently unavailable',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);

    try {
      const newCartItem: CartItem = {
        meal_id: meal.id,
        vendor_id: meal.vendor_id,
        name: meal.name,
        price: meal.price,
        quantity: 1,
        image_url: meal.image_url || undefined,
        is_veg: meal.is_veg,
        subscription_type: 'one-time',
        delivery_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        delivery_time: '12:00 PM',
      };

      addItem(newCartItem);

      toast({
        title: 'Added to cart',
        description: `${meal.name} has been added to your cart`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to add item to cart',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleIncrease = () => {
    if (!user) {
      requireAuthRedirect();
      return;
    }
    if (cartItem) {
      updateQuantity(meal.id, quantity + 1);
    }
  };

  const handleDecrease = () => {
    if (cartItem) {
      updateQuantity(meal.id, quantity - 1);
    }
  };

  // If item is in cart and showQuantity is true, show quantity controls
  if (quantity > 0 && showQuantity) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleDecrease}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center font-medium">{quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleIncrease}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Show "Added" state briefly
  if (quantity > 0 && !showQuantity) {
    return (
      <Button variant={variant} size={size} disabled>
        <Check className="h-4 w-4 mr-2" />
        Added
      </Button>
    );
  }

  // Default add to cart button
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleAddToCart}
      disabled={!isAvailable || isAdding}
    >
      <ShoppingCart className="h-4 w-4 mr-2" />
      {isAvailable ? 'Add to Cart' : 'Unavailable'}
    </Button>
  );
}
