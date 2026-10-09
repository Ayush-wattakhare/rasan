'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { MealType } from '@/types';
import type { Meal, MealInsert } from '@/lib/supabase/types';

const mealSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  price: z.number().min(0, 'Price must be positive'),
  discount_price: z.number().optional(),
  preparation_time: z.number().min(1, 'Preparation time is required'),
  is_veg: z.boolean(),
  is_available: z.boolean(),
  stock: z.number().optional(),
});

type MealFormData = z.infer<typeof mealSchema>;

interface MealFormProps {
  meal?: Meal;
  vendorId: string;
  onSubmit: (data: MealInsert) => Promise<void>;
  onCancel: () => void;
}

export function MealForm({ meal, vendorId, onSubmit, onCancel }: MealFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<MealFormData>({
    resolver: zodResolver(mealSchema),
    defaultValues: meal
      ? {
          name: meal.name,
          description: meal.description || '',
          category: meal.category,
          meal_type: meal.meal_type,
          price: meal.price,
          discount_price: meal.discount_price || undefined,
          preparation_time: meal.preparation_time,
          is_veg: meal.is_veg,
          is_available: meal.is_available,
          stock: meal.stock || undefined,
        }
      : {
          is_veg: true,
          is_available: true,
        },
  });

  const isVeg = watch('is_veg');
  const isAvailable = watch('is_available');

  const onFormSubmit = async (data: MealFormData) => {
    setIsSubmitting(true);
    try {
      const mealData: MealInsert = {
        ...data,
        vendor_id: vendorId,
        ingredients: [],
        allergens: [],
      };
      await onSubmit(mealData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Meal Name *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="e.g., Chicken Biryani"
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Describe your meal..."
          rows={3}
        />
      </div>

      {/* Category and Meal Type */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Input
            id="category"
            {...register('category')}
            placeholder="e.g., Indian, Chinese"
          />
          {errors.category && (
            <p className="text-sm text-red-600">{errors.category.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="meal_type">Meal Type *</Label>
          <Select
            onValueChange={(value) =>
              setValue('meal_type', value as MealType)
            }
            defaultValue={meal?.meal_type}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="breakfast">Breakfast</SelectItem>
              <SelectItem value="lunch">Lunch</SelectItem>
              <SelectItem value="dinner">Dinner</SelectItem>
              <SelectItem value="snack">Snack</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Price and Discount */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price (₹) *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            {...register('price', { valueAsNumber: true })}
            placeholder="0.00"
          />
          {errors.price && (
            <p className="text-sm text-red-600">{errors.price.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="discount_price">Discount Price (₹)</Label>
          <Input
            id="discount_price"
            type="number"
            step="0.01"
            {...register('discount_price', { valueAsNumber: true })}
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Preparation Time and Stock */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="preparation_time">Preparation Time (min) *</Label>
          <Input
            id="preparation_time"
            type="number"
            {...register('preparation_time', { valueAsNumber: true })}
            placeholder="30"
          />
          {errors.preparation_time && (
            <p className="text-sm text-red-600">
              {errors.preparation_time.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock">Stock (optional)</Label>
          <Input
            id="stock"
            type="number"
            {...register('stock', { valueAsNumber: true })}
            placeholder="Leave empty for unlimited"
          />
        </div>
      </div>

      {/* Switches */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="is_veg">Vegetarian</Label>
          <Switch
            id="is_veg"
            checked={isVeg}
            onCheckedChange={(checked) => setValue('is_veg', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="is_available">Available</Label>
          <Switch
            id="is_available"
            checked={isAvailable}
            onCheckedChange={(checked) => setValue('is_available', checked)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : meal ? (
            'Update Meal'
          ) : (
            'Create Meal'
          )}
        </Button>
      </div>
    </form>
  );
}
