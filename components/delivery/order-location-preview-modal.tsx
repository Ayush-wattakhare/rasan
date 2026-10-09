'use client';

import { X, MapPin, Home, Phone, Navigation, Package, DollarSign, Clock, ShieldCheck, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import dynamic from 'next/dynamic';

const NavigationMap = dynamic(() => import('@/components/delivery/navigation-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[220px] rounded-2xl bg-gray-900 animate-pulse flex items-center justify-center">
      <p className="text-[0.6rem] font-black text-gray-500 uppercase tracking-widest">Loading Route Matrix…</p>
    </div>
  ),
});

interface OrderLocationPreviewModalProps {
  order: any | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (orderId: string) => void | Promise<void>;
  isAccepting?: boolean;
}

export function OrderLocationPreviewModal({
  order,
  isOpen,
  onClose,
  onAccept,
  isAccepting,
}: OrderLocationPreviewModalProps) {
  if (!isOpen || !order) return null;

  const vendorName = order.vendors?.business_name || "Anita's Home Kitchen";
  const vendorAddress = order.vendors?.address || 'Pimpri Colony, Pimpri-Chinchwad, Pune';
  const vendorPhone = order.vendors?.phone || '+91 98765 43210';
  const customerName = order.profiles?.name || 'Customer';
  const customerPhone = order.profiles?.phone || '+91 98220 12345';
  const customerAddress = order.delivery_address?.street || 'Rahatani, Pimpri-Chinchwad';
  const customerCity = order.delivery_address?.city || 'Pune';
  const orderNum = order.order_number || (order.id ? order.id.slice(0, 8) : 'ORD-01');
  const items = Array.isArray(order.items) ? order.items : [];
  const itemCount = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);

  const pickupLat = order.vendors?.location?.coordinates?.[1] || 18.6279;
  const pickupLng = order.vendors?.location?.coordinates?.[0] || 73.8009;
  const dropLat = order.delivery_address?.coordinates?.lat || order.delivery_address?.lat || 18.6011;
  const dropLng = order.delivery_address?.coordinates?.lng || order.delivery_address?.lng || 73.7915;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div
        className="bg-white rounded-[2.5rem] max-w-xl w-full p-6 md:p-8 shadow-2xl relative border border-gray-100 animate-in zoom-in-95 duration-300 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm shrink-0">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Mission Route Details</h3>
              <Badge className="bg-green-600 text-white text-[0.6rem] font-black uppercase tracking-widest px-2.5 py-0.5">
                Ready for Pickup
              </Badge>
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              Order #{orderNum} • Bounty: ₹{order.delivery_fee || 40}
            </p>
          </div>
        </div>

        {/* Tactical Map Visual */}
        <div className="bg-gray-900 rounded-[2rem] overflow-hidden h-[210px] relative mb-6 border-2 border-gray-100 shadow-inner">
          <NavigationMap
            pickupLocation={{ lat: pickupLat, lng: pickupLng }}
            deliveryLocation={{ lat: dropLat, lng: dropLng }}
          />
          <div className="absolute top-3 left-3 z-10 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[0.55rem] font-black text-white uppercase tracking-widest">
            Estimated Route: ~3.2 km (12 mins)
          </div>
        </div>

        {/* Pickup & Delivery Location Cards */}
        <div className="space-y-4 mb-6">
          {/* Pickup Node */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[0.6rem] font-black uppercase tracking-widest text-blue-700 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5" /> 1. Pickup From Kitchen
              </span>
              <a
                href={`tel:${vendorPhone}`}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl shadow-xs"
              >
                <Phone className="w-3 h-3" /> Call Kitchen
              </a>
            </div>
            <div>
              <h4 className="font-black text-gray-900 text-sm">{vendorName}</h4>
              <p className="text-xs text-gray-600 font-medium mt-0.5">{vendorAddress}</p>
            </div>
          </div>

          {/* Drop-off Node */}
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[0.6rem] font-black uppercase tracking-widest text-emerald-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> 2. Deliver To Customer
              </span>
              <a
                href={`tel:${customerPhone}`}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl shadow-xs"
              >
                <Phone className="w-3 h-3" /> Call Customer
              </a>
            </div>
            <div>
              <h4 className="font-black text-gray-900 text-sm">{customerName}</h4>
              <p className="text-xs text-gray-600 font-medium mt-0.5">
                {customerAddress}, {customerCity}
              </p>
            </div>
          </div>
        </div>

        {/* Item Manifest */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
          <div className="text-[0.6rem] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-orange-500" /> Meal Manifest ({itemCount} units)
          </div>
          <div className="space-y-1.5">
            {items.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between text-xs font-bold text-gray-800">
                <span>{item.quantity}× {item.name}</span>
                <span className="text-gray-400">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1 h-14 rounded-2xl text-xs font-bold uppercase tracking-wider text-gray-500"
          >
            Close
          </Button>
          <Button
            type="button"
            disabled={isAccepting}
            onClick={() => onAccept(order.id)}
            className="flex-1 h-14 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4" /> ACCEPT THIS MISSION
          </Button>
        </div>
      </div>
    </div>
  );
}
