'use client';

import { useCartContext } from '@/lib/contexts/cart-context';

export function useCart() {
  return useCartContext();
}
