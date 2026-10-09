'use client';

import VendorCard from './vendor-card';

interface VendorGridProps {
  vendors: Array<{
    id: string;
    business_name: string;
    description: string | null;
    cuisine_types: string[] | null;
    rating: number | null;
    total_reviews: number | null;
    is_active: boolean;
  }>;
}

export default function VendorGrid({ vendors }: VendorGridProps) {
  if (vendors.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4 text-6xl">🏪</div>
        <h3 className="mb-2 text-xl font-semibold">No vendors found</h3>
        <p className="text-muted-foreground">
          Try adjusting your filters or search criteria
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {vendors.map((vendor) => (
        <VendorCard key={vendor.id} vendor={vendor} />
      ))}
    </div>
  );
}
