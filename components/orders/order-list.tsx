'use client';

import { OrderCard } from './order-card';
import type { Order } from '@/lib/supabase/types';

interface OrderListProps {
  orders: Order[];
  onOrderUpdated?: () => void;
  onTrackOrder?: (order: Order) => void;
}

export function OrderList({ orders, onOrderUpdated, onTrackOrder }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No orders found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onOrderUpdated={onOrderUpdated}
          onTrackOrder={onTrackOrder}
        />
      ))}
    </div>
  );
}
