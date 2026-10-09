'use client';

import { Button } from '@/components/ui/button';
import type { OrderStatus } from '@/types';

interface OrderFiltersProps {
  selectedStatus: OrderStatus | 'all';
  onStatusChange: (status: OrderStatus | 'all') => void;
}

export function OrderFilters({
  selectedStatus,
  onStatusChange,
}: OrderFiltersProps) {
  const statuses: { value: OrderStatus | 'all'; label: string; icon: string }[] = [
    { value: 'all', label: 'All Orders', icon: '📦' },
    { value: 'pending', label: 'Processing', icon: '⏳' },
    { value: 'confirmed', label: 'Confirmed', icon: '✅' },
    { value: 'preparing', label: 'Cooking', icon: '👩‍🍳' },
    { value: 'delivered', label: 'Delivered', icon: '🎁' },
    { value: 'cancelled', label: 'Cancelled', icon: '❌' },
  ];

  return (
    <div className="flex flex-wrap gap-2 p-1.5 bg-gray-50/50 rounded-[1.5rem] border border-gray-100 max-w-fit">
      {statuses.map((status) => (
        <Button
          key={status.value}
          variant={selectedStatus === status.value ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onStatusChange(status.value)}
          className={`rounded-xl px-4 h-10 font-bold transition-all ${
            selectedStatus === status.value 
              ? 'bg-[#1A1A1A] text-white shadow-xl' 
              : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
          }`}
        >
          <span className="mr-2 opacity-100">{status.icon}</span>
          <span className="uppercase tracking-widest text-[0.6rem]">{status.label}</span>
        </Button>
      ))}
    </div>
  );
}
