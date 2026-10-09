import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getVendors, getNearbyVendors, type VendorFilters } from '@/lib/services/vendor-service';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const radiusKm = searchParams.get('radiusKm');

    // If location is provided, use nearby vendors query
    if (latitude && longitude) {
      const vendors = await getNearbyVendors(
        supabase,
        parseFloat(latitude),
        parseFloat(longitude),
        radiusKm ? parseFloat(radiusKm) : 10
      );

      return NextResponse.json({
        vendors,
        total: vendors.length,
        page: 1,
        limit: vendors.length,
        totalPages: 1,
      });
    }

    // Otherwise use regular vendor query with filters
    const filters: VendorFilters = {
      cuisineType: searchParams.get('cuisineType') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const result = await getVendors(supabase, filters, page, limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/vendors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
