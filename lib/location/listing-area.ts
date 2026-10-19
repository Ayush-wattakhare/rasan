import type { SupabaseClient } from '@supabase/supabase-js';
import { getDeliveryLocation } from './server-location';
import {
  PREVIEW_AREAS,
  getNearbyKitchens,
  getServiceArea,
  isPreviewArea,
  type NearbyKitchen,
} from './nearby';

/**
 * What a listing page (/meals, /vendors) should show:
 * - 'nearby': kitchens that deliver to the customer's saved location;
 * - 'preview': a clearly labelled read-only city preview (?preview=pune);
 * - 'empty': no location / nothing in range / lookup failed. Never falls
 *   back to an unfiltered list of every kitchen.
 */
export type ListingArea =
  | { mode: 'nearby'; kitchens: NearbyKitchen[]; city: string }
  | { mode: 'preview'; kitchens: NearbyKitchen[]; previewLabel: string; city: string }
  | { mode: 'empty'; status: 'no-location' | 'unavailable' | 'lookup-failed'; city: string };

export async function resolveListingArea(
  supabase: SupabaseClient<any>,
  previewParam: unknown
): Promise<ListingArea> {
  const location = await getDeliveryLocation();
  const city = location?.city || '';

  if (isPreviewArea(previewParam)) {
    const area = PREVIEW_AREAS[previewParam];
    const kitchens = await getNearbyKitchens(supabase, area.lat, area.lng, area.radiusKm);
    if (kitchens && kitchens.length > 0) {
      return { mode: 'preview', kitchens, previewLabel: area.label, city };
    }
    return { mode: 'empty', status: kitchens === null ? 'lookup-failed' : 'unavailable', city: area.label };
  }

  const serviceArea = await getServiceArea(supabase, location);
  if (serviceArea.status === 'available') {
    return { mode: 'nearby', kitchens: serviceArea.kitchens, city };
  }
  if (serviceArea.status === 'no-location') return { mode: 'empty', status: 'no-location', city };
  return {
    mode: 'empty',
    status: serviceArea.reason === 'lookup-failed' ? 'lookup-failed' : 'unavailable',
    city,
  };
}
