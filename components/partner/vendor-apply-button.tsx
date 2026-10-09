'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import VendorApplicationModal from './vendor-application-modal';

export default function VendorApplyButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="lg"
        onClick={() => setOpen(true)}
        className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest px-10 h-16 rounded-2xl shadow-2xl transition-all hover:scale-105"
      >
        Start Application Now
      </Button>

      <VendorApplicationModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
