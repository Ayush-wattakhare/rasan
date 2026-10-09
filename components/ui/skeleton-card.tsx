import { Card, CardContent } from '@/components/ui/card';

export function MealCardSkeleton() {
  return (
    <Card className="overflow-hidden border-0 shadow-card bg-white">
      <div className="relative h-44 w-full bg-gray-200 shimmer" />
      <CardContent className="p-4">
        <div className="h-5 bg-gray-200 rounded shimmer mb-2 w-3/4" />
        <div className="h-4 bg-gray-200 rounded shimmer mb-3 w-1/2" />
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded shimmer w-20" />
          <div className="h-4 bg-gray-200 rounded shimmer w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export function VendorCardSkeleton() {
  return (
    <Card className="h-full border-0 shadow-card bg-white overflow-hidden">
      <div className="h-36 bg-gray-200 shimmer" />
      <CardContent className="p-4">
        <div className="h-5 bg-gray-200 rounded shimmer mb-2 w-3/4" />
        <div className="h-4 bg-gray-200 rounded shimmer mb-3 w-full" />
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 bg-gray-200 rounded shimmer w-16" />
          <div className="h-4 bg-gray-200 rounded shimmer w-16" />
        </div>
        <div className="h-4 bg-gray-200 rounded shimmer w-full" />
      </CardContent>
    </Card>
  );
}

export function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-200 shimmer" />
      <div className="h-3 bg-gray-200 rounded shimmer w-16" />
    </div>
  );
}
