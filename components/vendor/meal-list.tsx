'use client';

import Image from 'next/image';
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Meal } from '@/lib/supabase/types';

interface MealListProps {
  meals: Meal[];
  onEdit: (meal: Meal) => void;
  onDelete: (mealId: string) => void;
  onToggleAvailability: (mealId: string, isAvailable: boolean) => void;
}

export function MealList({
  meals,
  onEdit,
  onDelete,
  onToggleAvailability,
}: MealListProps) {
  if (meals.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No meals found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {meals.map((meal) => (
        <Card key={meal.id} className="overflow-hidden">
          <div className="relative h-48 bg-gray-100">
            {meal.image_url ? (
              <Image
                src={meal.image_url}
                alt={meal.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <span>No image</span>
              </div>
            )}
            <div className="absolute top-2 right-2 flex gap-2">
              <Badge variant={meal.is_veg ? 'default' : 'secondary'}>
                {meal.is_veg ? 'Veg' : 'Non-Veg'}
              </Badge>
              {!meal.is_available && (
                <Badge variant="destructive">Unavailable</Badge>
              )}
            </div>
          </div>

          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-1 line-clamp-1">
              {meal.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {meal.description || 'No description'}
            </p>

            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-lg font-bold">₹{meal.price.toFixed(2)}</span>
                {meal.discount_price && (
                  <span className="text-sm text-muted-foreground line-through ml-2">
                    ₹{meal.discount_price.toFixed(2)}
                  </span>
                )}
              </div>
              <Badge variant="outline">{meal.category}</Badge>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onEdit(meal)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onToggleAvailability(meal.id, !meal.is_available)
                }
              >
                {meal.is_available ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(meal.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
