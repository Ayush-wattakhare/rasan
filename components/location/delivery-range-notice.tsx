import { MapPin, AlertTriangle } from 'lucide-react';
import type { DeliveryRange } from '@/lib/location/delivery-range';
import { MAX_DELIVERY_RADIUS_KM } from '@/lib/utils/constants';

/** Banner on meal / kitchen detail pages saying whether this kitchen delivers to the customer. */
export function DeliveryRangeNotice({ range, city }: { range: DeliveryRange; city?: string }) {
  if (range.status === 'out-of-range') {
    return (
      <div role="alert" className="mb-6 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-bold text-red-900 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          This kitchen is {Math.round(range.distanceKm)} km from {city || 'your delivery location'} and doesn&apos;t
          deliver there (we deliver within {MAX_DELIVERY_RADIUS_KM} km so food arrives fresh). You can browse, but
          ordering is turned off.
        </span>
      </div>
    );
  }
  if (range.status === 'in-range') {
    return (
      <div role="status" className="mb-6 rounded-2xl bg-green-50 border border-green-200 px-4 py-3 text-sm font-bold text-green-900 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-green-600 shrink-0" aria-hidden="true" />
        Delivers to you · {range.distanceKm < 1 ? 'under 1 km' : `${range.distanceKm.toFixed(1)} km away`}
      </div>
    );
  }
  return null;
}
