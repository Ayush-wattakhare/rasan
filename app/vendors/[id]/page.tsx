import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getVendorById, getVendorMeals, isVendorOpen } from '@/lib/services/vendor-service';
import VendorHeader from '@/components/vendors/vendor-header';
import OperatingHours from '@/components/vendors/operating-hours';
import VendorMenu from '@/components/vendors/vendor-menu';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PublicVendorDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [vendor, meals] = await Promise.all([
    getVendorById(supabase, id),
    getVendorMeals(supabase, id),
  ]);

  if (!vendor || !vendor.is_active) {
    notFound();
  }

  const currentlyOpen = isVendorOpen(vendor.operating_hours);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/vendors">← Back to Vendors</Link>
        </Button>
      </div>

      <div className="mb-8">
        <VendorHeader vendor={vendor as any} />
      </div>

      <div className="mb-8">
        <OperatingHours
          operatingHours={vendor.operating_hours as any}
          isCurrentlyOpen={currentlyOpen}
        />
      </div>

      <VendorMenu meals={meals as any} />
    </div>
  );
}
