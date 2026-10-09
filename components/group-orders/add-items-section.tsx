'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AddItemsSectionProps {
  groupOrderId: string;
  meals: any[];
  currentUserId: string;
}

export default function AddItemsSection({
  groupOrderId,
  meals,
  currentUserId,
}: AddItemsSectionProps) {
  const [selectedItems, setSelectedItems] = useState<
    { meal_id: string; quantity: number; price: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const addItem = (meal: any) => {
    const existing = selectedItems.find((item) => item.meal_id === meal.id);
    if (existing) {
      setSelectedItems(
        selectedItems.map((item) =>
          item.meal_id === meal.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setSelectedItems([
        ...selectedItems,
        { meal_id: meal.id, quantity: 1, price: meal.price },
      ]);
    }
  };

  const removeItem = (mealId: string) => {
    const existing = selectedItems.find((item) => item.meal_id === mealId);
    if (existing && existing.quantity > 1) {
      setSelectedItems(
        selectedItems.map((item) =>
          item.meal_id === mealId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      );
    } else {
      setSelectedItems(selectedItems.filter((item) => item.meal_id !== mealId));
    }
  };

  const getItemQuantity = (mealId: string) => {
    const item = selectedItems.find((item) => item.meal_id === mealId);
    return item ? item.quantity : 0;
  };

  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleAddToGroup = async () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/group-orders/${groupOrderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems,
          contribution: totalAmount,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add items');
      }

      setSelectedItems([]);
      router.refresh();
    } catch (error) {
      console.error('Error adding items:', error);
      alert('Failed to add items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Add Your Items</h2>

      <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
        {meals.map((meal) => {
          const quantity = getItemQuantity(meal.id);
          return (
            <div
              key={meal.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium">{meal.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(meal.price)}
                </p>
              </div>

              {quantity === 0 ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addItem(meal)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeItem(meal.id)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addItem(meal)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedItems.length > 0 && (
        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Your Total</span>
            <span className="text-lg font-bold text-green-600">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          <Button
            onClick={handleAddToGroup}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Adding...' : 'Add to Group Order'}
          </Button>
        </div>
      )}
    </Card>
  );
}
