'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { OrderTracker } from '@/components/orders/order-tracker';
import { OrderDetails } from '@/components/orders/order-details';
import type { Order } from '@/lib/supabase/types';

interface OrderTrackingClientProps {
  initialOrder: Order;
}

export function OrderTrackingClient({ initialOrder }: OrderTrackingClientProps) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshOrder = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/orders/${order.id}`);
      if (!res.ok) return;
      const data: Order = await res.json();
      if (data && data.status) {
        setOrder(data);
      }
    } catch (err) {
      console.warn('Refresh order error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [order.id]);

  // Automated polling every 3 seconds for active orders
  useEffect(() => {
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return;
    }

    const interval = setInterval(() => {
      refreshOrder();
    }, 3000);

    return () => clearInterval(interval);
  }, [order.status, refreshOrder]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`order:${order.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          const updated = payload.new as Order;
          if (updated && updated.status) {
            // Merge: realtime rows don't carry the customer's handover-code embed.
            setOrder((prev) => ({ ...prev, ...updated }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id]);

  return (
    <div className="grid lg:grid-cols-2 gap-12 items-start">
      {/* Order Tracker with Real-time & Auto-polling */}
      <div className="space-y-8">
        <OrderTracker
          order={order}
          onRefresh={refreshOrder}
          isRefreshing={isRefreshing}
        />
      </div>

      {/* Order Details in sync */}
      <div className="space-y-8">
        <OrderDetails
          order={order}
          onOrderUpdated={refreshOrder}
        />
      </div>
    </div>
  );
}
