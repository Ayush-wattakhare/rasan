'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateVendorForm } from '@/components/admin/create-vendor-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Plus, Store, Sparkles } from 'lucide-react';

export function AdminAddVendorDrawer() {
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
        id="add-vendor-btn"
        onClick={() => setOpen(true)}
        className="h-12 px-6 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest text-[0.6rem] flex items-center gap-2 transition-all active:scale-95 shadow-md cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        Add Vendor
      </Button>

      {/* Centered Modal with z-[200] Teleported Portal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl w-full p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white max-h-[90vh] flex flex-col my-auto">
          {/* Header */}
          <div className="bg-[#1A1A1A] px-6 sm:px-8 py-5 text-white relative shrink-0">
            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-600/20 rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none" />
            
            <div className="relative z-10 space-y-1 pr-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-orange-400 text-[0.6rem] font-black uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> Vendor Onboarding
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black uppercase italic tracking-tight text-white leading-tight">
                Add New <span className="text-orange-500">Home Chef / Vendor</span>
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-xs font-semibold">
                Provision instant credentials, regulatory licenses & direct payout gateway
              </DialogDescription>
            </div>
          </div>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8">
            <CreateVendorForm
              onSuccess={handleSuccess}
              onCancel={() => setOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
