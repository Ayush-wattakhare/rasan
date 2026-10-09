'use client';

import { format } from 'date-fns';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { TrackingUpdate, OrderStatus } from '@/types';

interface StatusTimelineProps {
  trackingUpdates: TrackingUpdate[];
  currentStatus: OrderStatus;
}

const statusOrder: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'picked_up',
  'out_for_delivery',
  'delivered',
];

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Order Placed',
  confirmed: 'Order Confirmed',
  preparing: 'Preparing Your Food',
  ready: 'Ready for Pickup',
  ready_for_pickup: 'Ready for Pickup',
  picked_up: 'Picked Up',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function StatusTimeline({
  trackingUpdates,
  currentStatus,
}: StatusTimelineProps) {
  const normalizedStatus = currentStatus === 'ready' ? 'ready_for_pickup' : currentStatus;
  const currentStatusIndex = statusOrder.indexOf(normalizedStatus);

  return (
    <div className="space-y-4">
      {trackingUpdates.map((update, index) => {
        const isCompleted = true; // All tracking updates are completed
        const isLast = index === trackingUpdates.length - 1;

        return (
          <div key={index} className="flex gap-4">
            {/* Timeline indicator */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2',
                  isCompleted
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted bg-background'
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'w-0.5 flex-1 min-h-[40px]',
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-8">
              <h4 className="font-medium">
                {statusLabels[update.status] || update.status}
              </h4>
              <p className="text-sm text-muted-foreground">
                {format(new Date(update.timestamp), 'PPp')}
              </p>
              {update.note && (
                <p className="text-sm text-muted-foreground mt-1">
                  {update.note}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
