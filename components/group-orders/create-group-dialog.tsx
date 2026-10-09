'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CreateGroupDialogProps {
  vendors: any[];
}

export default function CreateGroupDialog({ vendors }: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vendorId, setVendorId] = useState('');
  const [expiresInHours, setExpiresInHours] = useState('2');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) {
      alert('Please select a vendor');
      return;
    }
    setIsLoading(true);

    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(expiresInHours));

      const response = await fetch('/api/group-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: vendorId,
          expires_at: expiresAt.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create group order');
      }

      const groupOrder = await response.json();
      router.push(`/group-order/${groupOrder.group_id}`);
    } catch (error) {
      console.error('Error creating group order:', error);
      alert('Failed to create group order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Users className="h-4 w-4 mr-2" />
          Create Group Order
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Group Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="vendor">Select Vendor</Label>
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.business_name} ({vendor.rating.toFixed(1)} ⭐)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="expires">Expires In (hours)</Label>
            <Input
              id="expires"
              type="number"
              min="1"
              max="24"
              value={expiresInHours}
              onChange={(e) => setExpiresInHours(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              Participants can join and add items until the order expires
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Creating...' : 'Create Group Order'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
