'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MealForm } from './meal-form';
import type { Meal, MealInsert } from '@/lib/supabase/types';

interface CreateMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meal?: Meal;
  vendorId: string;
  onSubmit: (data: MealInsert) => Promise<void>;
}

export function CreateMealDialog({
  open,
  onOpenChange,
  meal,
  vendorId,
  onSubmit,
}: CreateMealDialogProps) {
  const handleSubmit = async (data: MealInsert) => {
    await onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {meal ? 'Edit Meal' : 'Create New Meal'}
          </DialogTitle>
        </DialogHeader>
        <MealForm
          meal={meal}
          vendorId={vendorId}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
