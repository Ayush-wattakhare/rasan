import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/vendors/[id]/location
 * Returns only the lat/lng of a vendor kitchen — used by the checkout
 * freshness-guard to calculate customer ↔ kitchen distance before order placement.
 * The vendor `location` column is GEOGRAPHY(POINT, 4326); we cast it to text
 * and parse the WKT "POINT(lng lat)" format.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Invalid vendor id' }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  const { data: vendor, error } = await serviceClient
    .from('vendors')
    .select('id, location')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !vendor) {
    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
  }

  // Parse WKT "POINT(lng lat)" from PostGIS geography text cast
  const match = vendor.location
    ? String(vendor.location).match(/POINT\(([\d.\-]+)\s+([\d.\-]+)\)/)
    : null;

  if (!match) {
    // Vendor exists but has no location set yet
    return NextResponse.json({ lat: null, lng: null });
  }

  return NextResponse.json({
    lng: parseFloat(match[1]),
    lat: parseFloat(match[2]),
  });
}
