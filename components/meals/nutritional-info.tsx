import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NutritionalInfoProps {
  nutritionalInfo: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  } | null;
}

export default function NutritionalInfo({ nutritionalInfo }: NutritionalInfoProps) {
  if (!nutritionalInfo) {
    return null;
  }

  const items = [
    { label: 'Calories', value: nutritionalInfo.calories, unit: 'kcal' },
    { label: 'Protein', value: nutritionalInfo.protein, unit: 'g' },
    { label: 'Carbs', value: nutritionalInfo.carbs, unit: 'g' },
    { label: 'Fat', value: nutritionalInfo.fat, unit: 'g' },
    { label: 'Fiber', value: nutritionalInfo.fiber, unit: 'g' },
  ].filter((item) => item.value !== undefined && item.value !== null);

  if (items.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nutritional Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-2xl font-bold text-primary">
                {item.value}
                <span className="text-sm font-normal text-muted-foreground">
                  {item.unit}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
