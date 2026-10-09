'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateDeliveryForm } from '@/components/admin/create-delivery-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Plus, Bike, Sparkles } from 'lucide-react';

export function AdminAddDeliveryDrawer() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        id="add-rider-btn"
        onClick={() => setOpen(true)}
        className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[0.6rem] flex items-center gap-2 transition-all active:scale-95 shadow-md cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        Add Rider
      </Button>

      {/* Centered Modal with z-[200] Teleported Portal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl w-full p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white max-h-[90vh] flex flex-col my-auto">
          {/* Header */}
          <div className="bg-[#121212] px-6 sm:px-8 py-5 text-white relative shrink-0">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/20 rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none" />
            
            <div className="relative z-10 space-y-1 pr-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-blue-400 text-[0.6rem] font-black uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> Pilot Dispatch Onboarding
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black uppercase italic tracking-tight text-white leading-tight">
                Add New <span className="text-blue-500">Delivery Partner / Rider</span>
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-xs font-semibold">
                Provision operator credentials, vehicle compliance & payout routing
              </DialogDescription>
            </div>
          </div>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8">
            <CreateDeliveryForm
              onSuccess={handleSuccess}
              onCancel={() => setOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
