'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

interface OnlineToggleProps {
  deliveryPartnerId: string;
  initialStatus: boolean;
}

export default function OnlineToggle({
  deliveryPartnerId,
  initialStatus,
}: OnlineToggleProps) {
  const [isOnline, setIsOnline] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/delivery-partners/${deliveryPartnerId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_online: checked }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      setIsOnline(checked);
      router.refresh();
    } catch (error) {
      console.error('Error updating online status:', error);
      // Revert on error
      setIsOnline(!checked);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="online-mode"
        checked={isOnline}
        onCheckedChange={handleToggle}
        disabled={isLoading}
      />
      <Label htmlFor="online-mode" className="cursor-pointer">
        {isOnline ? 'Online' : 'Offline'}
      </Label>
    </div>
  );
}
