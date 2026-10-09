'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, DollarSign, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DeliveryOrderCardProps {
  order: any;
  onAccept?: () => void;
  isAccepting?: boolean;
  disabled?: boolean;
  showActions?: boolean;
}

export default function DeliveryOrderCard({
  order,
  onAccept,
  isAccepting = false,
  disabled = false,
  showActions = true,
}: DeliveryOrderCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Order #{order.order_number}</h3>
          <p className="text-sm text-muted-foreground">
            {order.vendors?.business_name || 'Unknown Vendor'}
          </p>
        </div>
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
        </Badge>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">Pickup</p>
            <p className="text-sm text-muted-foreground">
              {order.vendors?.address || 'Address not available'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">Delivery</p>
            <p className="text-sm text-muted-foreground">
              {order.delivery_address?.street}, {order.delivery_address?.city}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">Delivery Fee</p>
            <p className="text-sm text-green-600 font-semibold">
              {formatCurrency(order.delivery_fee)}
            </p>
          </div>
        </div>
      </div>

      {showActions && onAccept && (
        <Button
          onClick={onAccept}
          disabled={disabled || isAccepting}
          className="w-full"
        >
          {isAccepting ? 'Accepting...' : 'Accept Order'}
        </Button>
      )}
    </Card>
  );
}
