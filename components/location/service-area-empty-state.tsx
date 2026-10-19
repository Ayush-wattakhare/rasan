'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, AlertTriangle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationSelectorModal } from '@/components/location/location-selector-modal';

interface ServiceAreaEmptyStateProps {
  status: 'no-location' | 'unavailable' | 'lookup-failed';
  /** Customer's city, e.g. "Nagpur". */
  city: string;
  /** Where "Browse Pune menus" should go (a ?preview=pune listing). */
  previewHref?: string;
  /** "dishes" or "kitchens", used in the copy. */
  noun?: string;
}

/** Shown on listing pages instead of an unfiltered list when nothing delivers to the customer. */
export function ServiceAreaEmptyState({ status, city, previewHref, noun = 'kitchens' }: ServiceAreaEmptyStateProps) {
  const [mapOpen, setMapOpen] = useState(false);
  const place = city || 'your location';

  const copy = {
    'no-location': {
      icon: <MapPin className="w-8 h-8" aria-hidden="true" />,
      title: 'Set your delivery location',
      body: `We deliver within 10 km of each home kitchen. Choose your location to see the ${noun} that deliver to you.`,
    },
    unavailable: {
      icon: <MapPin className="w-8 h-8" aria-hidden="true" />,
      title: `We're not in ${city || 'your area'} yet`,
      body: `No Rasan home kitchen delivers within 10 km of ${place}. We currently deliver in Pune and are expanding.`,
    },
    'lookup-failed': {
      icon: <AlertTriangle className="w-8 h-8" aria-hidden="true" />,
      title: `We couldn't check ${noun} near you`,
      body: 'Please try again in a moment.',
    },
  }[status];

  return (
    <>
      <LocationSelectorModal isOpen={mapOpen} onClose={() => setMapOpen(false)} />
      <div role="status" className="bg-white rounded-[2rem] sm:rounded-[3rem] p-10 sm:p-16 text-center border-2 border-dashed border-gray-100">
        <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
          {copy.icon}
        </div>
        <h3 className="text-2xl font-black text-[#1A1A1A] tracking-tight">{copy.title}</h3>
        <p className="text-sm font-medium text-gray-500 mt-3 max-w-md mx-auto leading-relaxed">{copy.body}</p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => setMapOpen(true)}
            className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest bg-orange-600 hover:bg-orange-500 text-white"
          >
            <MapPin className="w-4 h-4 mr-2" aria-hidden="true" />
            {status === 'no-location' ? 'Choose Location' : 'Change Location'}
          </Button>
          {status === 'unavailable' && previewHref && (
            <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold border-2 border-gray-100" asChild>
              <Link href={previewHref}>
                <Eye className="w-4 h-4 mr-2" aria-hidden="true" /> Browse Pune menus (preview)
              </Link>
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

/** Banner for ?preview= listings: makes clear these kitchens don't deliver to the customer. */
export function PreviewBanner({ label, city, basePath }: { label: string; city: string; basePath: string }) {
  return (
    <div role="note" className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm font-bold text-amber-900 flex flex-wrap items-center justify-center gap-2 text-center">
      <Eye className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
      <span>
        Preview: kitchens in {label}. They don&apos;t deliver to {city || 'your location'}, so you can browse but not order.
      </span>
      <Link href={basePath} className="underline font-black text-amber-800 hover:text-amber-950">
        Back to kitchens near me
      </Link>
    </div>
  );
}
