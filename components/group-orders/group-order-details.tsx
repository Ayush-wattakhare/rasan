'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ParticipantList from './participant-list';
import AddItemsSection from './add-items-section';
import ShareLink from './share-link';
import { Clock, Users, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

interface GroupOrderDetailsProps {
  groupOrder: any;
  meals: any[];
  currentUserId: string;
  isExpired: boolean;
}

export default function GroupOrderDetails({
  groupOrder,
  meals,
  currentUserId,
  isExpired,
}: GroupOrderDetailsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const isHost = groupOrder.host_id === currentUserId;
  const participants = groupOrder.participants || [];
  const totalAmount = participants.reduce(
    (sum: number, p: any) => sum + p.contribution,
    0
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const handleFinalize = async () => {
    if (!confirm('Are you sure you want to finalize this group order?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/group-orders/${groupOrder.id}/finalize`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to finalize group order');
      }

      const result = await response.json();
      alert('Group order finalized successfully!');
      router.push(`/orders/${result.order_id}`);
    } catch (error) {
      console.error('Error finalizing group order:', error);
      alert('Failed to finalize group order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (groupOrder.status === 'ordered') {
      return <Badge className="bg-green-100 text-green-800">Ordered</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800">Open</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Group Order</h1>
            <p className="text-muted-foreground">
              {groupOrder.vendors?.business_name}
            </p>
          </div>
          {getStatusBadge()}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Expires</p>
              <p className="font-medium">
                {formatDistanceToNow(new Date(groupOrder.expires_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Participants</p>
              <p className="font-medium">{participants.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-medium text-green-600">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>
        </div>

        {!isExpired && groupOrder.status === 'open' && (
          <ShareLink groupId={groupOrder.group_id} />
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ParticipantList
          participants={participants}
          currentUserId={currentUserId}
        />

        {!isExpired && groupOrder.status === 'open' && (
          <AddItemsSection
            groupOrderId={groupOrder.id}
            meals={meals}
            currentUserId={currentUserId}
          />
        )}
      </div>

      {isHost && !isExpired && groupOrder.status === 'open' && participants.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Ready to order?</h3>
              <p className="text-sm text-muted-foreground">
                Finalize the group order to place it with the vendor
              </p>
            </div>
            <Button onClick={handleFinalize} disabled={isLoading}>
              {isLoading ? 'Finalizing...' : 'Finalize Order'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
