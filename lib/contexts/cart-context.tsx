'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { CartItem, Cart, SubscriptionType } from '@/types';

const CART_STORAGE_KEY = 'rasan_cart';
const PLATFORM_FEE = 2;
const DELIVERY_FEE = 0;

interface CartContextType {
  cart: Cart;
  addItem: (item: Partial<CartItem> & { meal_id: string; vendor_id: string; name: string; price: number; is_veg: boolean }) => void;
  updateQuantity: (meal_id: string, quantity: number, subscription_type?: SubscriptionType) => void;
  updateItemOptions: (meal_id: string, oldType: SubscriptionType, updates: Partial<CartItem>) => void;
  removeItem: (meal_id: string, subscription_type?: SubscriptionType) => void;
  clearCart: () => void;
  itemCount: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const getItemPricing = (item: CartItem) => {
  const subType = item.subscription_type || 'one-time';
  const price = Number(item.price) || 0;
  const quantity = Math.max(1, item.quantity || 1);
  const daysCount = Math.max(1, (item.delivery_days || []).length);

  let discountPct = 0;
  let multiplier = 1;
  let cycleDescription = '1 meal';

  if (subType === 'weekly') {
    discountPct = 20; // 20% OFF for weekly plan
    multiplier = daysCount; // Delivers on each selected day in the week
    cycleDescription = `${daysCount} meal${daysCount > 1 ? 's' : ''} (${daysCount} days/wk)`;
  } else if (subType === 'monthly') {
    discountPct = 30; // 30% OFF for monthly plan
    multiplier = daysCount * 4; // 4 weeks of selected delivery days
    cycleDescription = `${daysCount * 4} meals (${daysCount} days/wk × 4 wks)`;
  } else {
    // One-time / Daily
    discountPct = 0;
    multiplier = 1;
    cycleDescription = '1 meal';
  }

  const basePrice = price * multiplier * quantity;
  const savings = Math.round((basePrice * discountPct) / 100);
  const finalPrice = Math.max(0, basePrice - savings);
  const pricePerMeal = multiplier > 0 ? finalPrice / (multiplier * quantity) : price;

  return {
    subType,
    daysCount,
    multiplier,
    discountPct,
    basePrice,
    savings,
    finalPrice,
    pricePerMeal,
    cycleDescription,
  };
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>({
    items: [],
    vendor_id: undefined,
    subtotal: 0,
    base_subtotal: 0,
    total_savings: 0,
    platform_fee: PLATFORM_FEE,
    delivery_fee: DELIVERY_FEE,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const calculateTotals = useCallback((items: CartItem[]) => {
    let baseSubtotal = 0;
    let totalSavings = 0;
    let subtotal = 0;

    items.forEach((item) => {
      const pricing = getItemPricing(item);
      baseSubtotal += pricing.basePrice;
      totalSavings += pricing.savings;
      subtotal += pricing.finalPrice;
    });

    return {
      base_subtotal: baseSubtotal,
      total_savings: totalSavings,
      subtotal,
      total: subtotal + PLATFORM_FEE + DELIVERY_FEE,
    };
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsedCart = JSON.parse(stored) as Cart;
        
        const sanitizedItems = (parsedCart.items || []).map((item) => {
          const subType = item.subscription_type || 'one-time';
          const discountPct =
            subType === 'weekly' ? 20 : subType === 'monthly' ? 30 : 0;

          return {
            ...item,
            subscription_type: subType,
            delivery_days:
              item.delivery_days && item.delivery_days.length > 0
                ? item.delivery_days
                : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            delivery_time: item.delivery_time || '12:00 PM',
            discount_percentage: discountPct,
          };
        });

        const totals = calculateTotals(sanitizedItems);

        setCart({
          ...parsedCart,
          items: sanitizedItems,
          platform_fee: PLATFORM_FEE,
          delivery_fee: parsedCart.delivery_fee ?? DELIVERY_FEE,
          base_subtotal: totals.base_subtotal,
          total_savings: totals.total_savings,
          subtotal: totals.subtotal,
          total: totals.total,
        });
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setIsLoading(false);
    }
  }, [calculateTotals]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } catch (error) {
        console.error('Failed to save cart:', error);
      }
    }
  }, [cart, isLoading]);

  const addItem = useCallback(
    (item: Partial<CartItem> & { meal_id: string; vendor_id: string; name: string; price: number; is_veg: boolean }) => {
      setCart((prevCart) => {
        const fullItem: CartItem = {
          quantity: 1,
          subscription_type: 'one-time',
          delivery_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          delivery_time: '12:00 PM',
          discount_percentage: 0,
          ...item,
        } as CartItem;

        if (prevCart.items.length > 0 && prevCart.vendor_id !== fullItem.vendor_id) {
          throw new Error('Cannot add items from different vendors. Please clear your cart first.');
        }

        const existingItemIndex = prevCart.items.findIndex(
          (i) => i.meal_id === fullItem.meal_id && i.subscription_type === (fullItem.subscription_type || 'one-time')
        );

        let newItems: CartItem[];
        if (existingItemIndex >= 0) {
          newItems = [...prevCart.items];
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newItems[existingItemIndex].quantity + (fullItem.quantity || 1),
          };
        } else {
          newItems = [...prevCart.items, fullItem];
        }

        const totals = calculateTotals(newItems);
        return {
          ...prevCart,
          items: newItems,
          vendor_id: fullItem.vendor_id,
          ...totals,
        };
      });
    },
    [calculateTotals]
  );

  const updateQuantity = useCallback(
    (meal_id: string, quantity: number, subscription_type: SubscriptionType = 'one-time') => {
      setCart((prevCart) => {
        if (quantity <= 0) {
          const newItems = prevCart.items.filter(
            (i) => !(i.meal_id === meal_id && (i.subscription_type || 'one-time') === subscription_type)
          );
          const totals = calculateTotals(newItems);
          return {
            ...prevCart,
            items: newItems,
            vendor_id: newItems.length > 0 ? prevCart.vendor_id : undefined,
            ...totals,
          };
        }

        const newItems = prevCart.items.map((item) =>
          item.meal_id === meal_id && (item.subscription_type || 'one-time') === subscription_type 
            ? { ...item, quantity } 
            : item
        );

        const totals = calculateTotals(newItems);
        return {
          ...prevCart,
          items: newItems,
          ...totals,
        };
      });
    },
    [calculateTotals]
  );

  const updateItemOptions = useCallback(
    (meal_id: string, oldType: SubscriptionType, updates: Partial<CartItem>) => {
      setCart((prevCart) => {
        const newItems = prevCart.items.map((item) => {
          if (item.meal_id === meal_id && (item.subscription_type || 'one-time') === oldType) {
            const nextType = updates.subscription_type ?? item.subscription_type ?? 'one-time';
            let nextDiscount = updates.discount_percentage ?? item.discount_percentage ?? 0;

            if (updates.subscription_type !== undefined) {
              nextDiscount =
                updates.subscription_type === 'weekly'
                  ? 20
                  : updates.subscription_type === 'monthly'
                  ? 30
                  : 0;
            }

            return {
              ...item,
              ...updates,
              subscription_type: nextType,
              discount_percentage: nextDiscount,
            };
          }
          return item;
        });

        const totals = calculateTotals(newItems);
        return {
          ...prevCart,
          items: newItems,
          ...totals,
        };
      });
    },
    [calculateTotals]
  );

  const removeItem = useCallback(
    (meal_id: string, subscription_type: SubscriptionType = 'one-time') => {
      setCart((prevCart) => {
        const newItems = prevCart.items.filter(
          (i) => !(i.meal_id === meal_id && (i.subscription_type || 'one-time') === subscription_type)
        );
        const totals = calculateTotals(newItems);
        return {
          ...prevCart,
          items: newItems,
          vendor_id: newItems.length > 0 ? prevCart.vendor_id : undefined,
          ...totals,
        };
      });
    },
    [calculateTotals]
  );

  const clearCart = useCallback(() => {
    setCart({
      items: [],
      vendor_id: undefined,
      subtotal: 0,
      platform_fee: PLATFORM_FEE,
      delivery_fee: DELIVERY_FEE,
      total: 0,
    });
  }, []);

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        updateQuantity,
        updateItemOptions,
        removeItem,
        clearCart,
        itemCount,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
}
