'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import { isValidPlanStart } from '@/lib/pricing/plan-schedule';
import type { CartItem, Cart, SubscriptionType } from '@/types';

const CART_STORAGE_KEY = 'rasan_cart';
import {
  DEFAULT_DELIVERY_DAYS,
  DELIVERY_FEE,
  PLATFORM_FEE,
  SUBSCRIPTION_DISCOUNT_PCT,
  calculateCartTotals,
  getItemPricing,
} from '@/lib/pricing/order-pricing';

const EMPTY_CART: Cart = {
  items: [],
  vendor_id: undefined,
  subtotal: 0,
  base_subtotal: 0,
  total_savings: 0,
  platform_fee: PLATFORM_FEE,
  delivery_fee: DELIVERY_FEE,
  total: 0,
};

export { getItemPricing };

export interface AddItemResult {
  success: boolean;
  conflict?: boolean;
  currentVendorId?: string;
}

interface CartContextType {
  cart: Cart;
  addItem: (
    item: Partial<CartItem> & { meal_id: string; vendor_id: string; name: string; price: number; is_veg: boolean },
    options?: { replaceIfConflict?: boolean }
  ) => AddItemResult;
  clearAndAddItem: (
    item: Partial<CartItem> & { meal_id: string; vendor_id: string; name: string; price: number; is_veg: boolean }
  ) => void;
  updateQuantity: (meal_id: string, quantity: number, subscription_type?: SubscriptionType) => void;
  updateItemOptions: (meal_id: string, oldType: SubscriptionType, updates: Partial<CartItem>) => void;
  removeItem: (meal_id: string, subscription_type?: SubscriptionType) => void;
  clearCart: () => void;
  itemCount: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCartState] = useState<Cart>(EMPTY_CART);
  const [isLoading, setIsLoading] = useState(true);

  // Always-current cart for synchronous checks (addItem's vendor conflict),
  // so two quick adds can't both read a stale closure.
  const cartRef = useRef<Cart>(EMPTY_CART);
  // Every cart update goes through here and is applied to the ref synchronously,
  // so the ref is always the latest cart even before React re-renders.
  const setCart = useCallback((next: Cart | ((prev: Cart) => Cart)) => {
    const value = typeof next === 'function' ? (next as (p: Cart) => Cart)(cartRef.current) : next;
    cartRef.current = value;
    setCartState(value);
  }, []);

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
            price: Math.round(Number(item.price) || 0),
            subscription_type: subType,
            // Same default as addItem, so a reload never changes the price.
            delivery_days:
              item.delivery_days && item.delivery_days.length > 0
                ? item.delivery_days
                : [...DEFAULT_DELIVERY_DAYS],
            delivery_time: item.delivery_time || '12:30 PM',
            discount_percentage: discountPct,
            // A start date saved days ago may now be in the past: fall back to tomorrow.
            plan_start_date: isValidPlanStart(item.plan_start_date) ? item.plan_start_date : undefined,
          };
        });

        const totals = calculateTotals(sanitizedItems);

        setCart({
          ...parsedCart,
          items: sanitizedItems,
          platform_fee: PLATFORM_FEE,
          // Never trust a stored fee; the server charges DELIVERY_FEE.
          delivery_fee: DELIVERY_FEE,
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
  }, [calculateTotals, setCart]);

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

  const clearAndAddItem = useCallback(
    (item: Partial<CartItem> & { meal_id: string; vendor_id: string; name: string; price: number; is_veg: boolean }) => {
      const fullItem: CartItem = {
        quantity: 1,
        subscription_type: 'one-time',
        delivery_days: [...DEFAULT_DELIVERY_DAYS],
        delivery_time: '12:30 PM',
        discount_percentage: 0,
        ...item,
      } as CartItem;

      const newItems = [fullItem];
      const totals = calculateTotals(newItems);
      setCart({
        items: newItems,
        vendor_id: fullItem.vendor_id,
        platform_fee: PLATFORM_FEE,
        delivery_fee: DELIVERY_FEE,
        ...totals,
      });
    },
    [calculateTotals, setCart]
  );

  const addItem = useCallback(
    (
      item: Partial<CartItem> & { meal_id: string; vendor_id: string; name: string; price: number; is_veg: boolean },
      options?: { replaceIfConflict?: boolean }
    ): AddItemResult => {
      const fullItem: CartItem = {
        quantity: 1,
        subscription_type: 'one-time',
        delivery_days: [...DEFAULT_DELIVERY_DAYS],
        delivery_time: '12:30 PM',
        discount_percentage: 0,
        ...item,
        price: Math.round(Number(item.price) || 0),
      } as CartItem;

      // 1. Check for vendor conflict synchronously against the latest cart.
      const current = cartRef.current;
      if (current.items.length > 0 && current.vendor_id && current.vendor_id !== fullItem.vendor_id) {
        if (options?.replaceIfConflict) {
          clearAndAddItem(fullItem);
          return { success: true, conflict: false };
        }
        return { success: false, conflict: true, currentVendorId: current.vendor_id };
      }

      // 2. Safe state update (never throw inside React state updater)
      setCart((prevCart) => {
        if (prevCart.items.length > 0 && prevCart.vendor_id && prevCart.vendor_id !== fullItem.vendor_id) {
          if (options?.replaceIfConflict) {
            const newItems = [fullItem];
            const totals = calculateTotals(newItems);
            return {
              ...prevCart,
              items: newItems,
              vendor_id: fullItem.vendor_id,
              ...totals,
            };
          }
          return prevCart;
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

      return { success: true, conflict: false };
    },
    [calculateTotals, clearAndAddItem, setCart]
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
    [calculateTotals, setCart]
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
    [calculateTotals, setCart]
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
    [calculateTotals, setCart]
  );

  const clearCart = useCallback(() => {
    setCart({ ...EMPTY_CART });
  }, [setCart]);

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  // Memoized so consumers (and memo(MealCard)) only re-render when something changed.
  const value = useMemo(
    () => ({
      cart,
      addItem,
      clearAndAddItem,
      updateQuantity,
      updateItemOptions,
      removeItem,
      clearCart,
      itemCount,
      isLoading,
    }),
    [cart, addItem, clearAndAddItem, updateQuantity, updateItemOptions, removeItem, clearCart, itemCount, isLoading]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext(): CartContextType {
  const context = useContext(CartContext);
  if (context === undefined) {
    return {
      cart: {
        items: [],
        vendor_id: undefined,
        subtotal: 0,
        base_subtotal: 0,
        total_savings: 0,
        platform_fee: PLATFORM_FEE,
        delivery_fee: DELIVERY_FEE,
        total: 0,
      },
      addItem: () => ({ success: true }),
      clearAndAddItem: () => {},
      updateQuantity: () => {},
      updateItemOptions: () => {},
      removeItem: () => {},
      clearCart: () => {},
      itemCount: 0,
      isLoading: false,
    };
  }
  return context;
}
