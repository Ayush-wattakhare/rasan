'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { CartItem, Cart, SubscriptionType } from '@/types';

const CART_STORAGE_KEY = 'rasan_cart';
import {
  DELIVERY_FEE,
  PLATFORM_FEE,
  SUBSCRIPTION_DISCOUNT_PCT,
  calculateCartTotals,
  getItemPricing,
} from '@/lib/pricing/order-pricing';

export { getItemPricing };

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
    const { base_subtotal, total_savings, subtotal, total } = calculateCartTotals(items);
    return { base_subtotal, total_savings, subtotal, total };
  }, []);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsedCart = JSON.parse(stored) as Cart;
        
        const sanitizedItems = (parsedCart.items || []).map((item) => {
          const subType = item.subscription_type || 'one-time';
          const discountPct = SUBSCRIPTION_DISCOUNT_PCT[subType] ?? 0;

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
              nextDiscount = SUBSCRIPTION_DISCOUNT_PCT[updates.subscription_type] ?? 0;
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
