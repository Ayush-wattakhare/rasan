'use client';

import { useState } from 'react';
import DeliveryOrderCard from './delivery-order-card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface Order {
  id: string;
  order_number: string;
  total: number;
  delivery_fee: number;
  delivery_address: any;
  created_at: string;
  vendors: {
    id: string;
    business_name: string;
    address: string;
    location: any;
  };
}

interface AvailableOrdersListProps {
  orders: Order[];
  deliveryPartnerId: string;
  isOnline: boolean;
  currentLocation: any;
}

export default function AvailableOrdersList({
  orders,
  deliveryPartnerId,
  isOnline,
  currentLocation,
}: AvailableOrdersListProps) {
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);
  const router = useRouter();

  const handleAcceptOrder = async (orderId: string) => {
    if (!isOnline) {
      alert('You must be online to accept orders');
      return;
    }

    setAcceptingOrderId(orderId);
    try {
      const response = await fetch(
        `/api/delivery-partners/orders/${orderId}/accept`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delivery_partner_id: deliveryPartnerId }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to accept order');
      }

      router.push('/active-deliveries');
      router.refresh();
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('Failed to accept order. Please try again.');
    } finally {
      setAcceptingOrderId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No available orders at the moment.</p>
        <Button
          onClick={() => router.refresh()}
          variant="outline"
          className="mt-4"
        >
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <DeliveryOrderCard
          key={order.id}
          order={order}
          onAccept={() => handleAcceptOrder(order.id)}
          isAccepting={acceptingOrderId === order.id}
          disabled={!isOnline}
        />
      ))}
    </div>
  );
}
