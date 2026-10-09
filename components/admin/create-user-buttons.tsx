'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateVendorForm } from './create-vendor-form';
import { CreateDeliveryForm } from './create-delivery-form';

export default function CreateUserButtons() {
  const [showCreateVendor, setShowCreateVendor] = useState(false);
  const [showCreateDelivery, setShowCreateDelivery] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleVendorSuccess = () => {
    setShowCreateVendor(false);
    window.location.reload();
  };

  const handleDeliverySuccess = () => {
    setShowCreateDelivery(false);
    window.location.reload();
  };

  return (
    <>
      <div className="flex gap-3">
        <Button 
          onClick={() => setShowCreateVendor(true)}
          className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest text-[0.6rem] h-12 rounded-xl transition-all shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Vendor
        </Button>
        <Button 
          onClick={() => setShowCreateDelivery(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[0.6rem] h-12 rounded-xl transition-all shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Delivery Partner
        </Button>
      </div>

      {mounted && showCreateVendor && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
            <CreateVendorForm 
              onSuccess={handleVendorSuccess}
              onCancel={() => setShowCreateVendor(false)}
            />
          </div>
        </div>,
        document.body
      )}

      {mounted && showCreateDelivery && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
            <CreateDeliveryForm 
              onSuccess={handleDeliverySuccess}
              onCancel={() => setShowCreateDelivery(false)}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}