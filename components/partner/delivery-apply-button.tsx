'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import DeliveryApplicationModal from './delivery-application-modal';

export default function DeliveryApplyButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="lg"
        onClick={() => setOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest px-10 h-16 rounded-2xl shadow-2xl transition-all hover:scale-105"
      >
        Start Rider Application
      </Button>

      <DeliveryApplicationModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
