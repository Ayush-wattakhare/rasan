'use client';

import { useState } from 'react';
import { 
  MapPin, 
  Plus, 
  Loader2, 
  X, 
  Navigation, 
  Crosshair, 
  Map, 
  Home, 
  Briefcase, 
  Users, 
  Flag, 
  Phone, 
  User, 
  BellOff, 
  DoorOpen, 
  PhoneCall, 
  VolumeX, 
  Sparkles,
  Building,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/lib/hooks/use-toast';
import { getAccurateLocation, AccurateLocationResult } from '@/lib/hooks/use-location';
import { LocationSelectorModal } from '@/components/location/location-selector-modal';
import type { Address } from '@/types';

interface DeliveryAddressSectionProps {
  addresses: Address[];
  selectedAddress: Address | null;
  onSelectAddress: (address: Address) => void;
  onAddAddress?: () => void;
}

type AddressTag = 'home' | 'work' | 'friends_family' | 'other';

const ADDRESS_TAGS: { id: AddressTag; label: string; icon: any }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'work', label: 'Work', icon: Briefcase },
  { id: 'friends_family', label: 'Friends & Family', icon: Users },
  { id: 'other', label: 'Other', icon: MapPin },
];

const DELIVERY_PREFERENCES = [
  { id: 'leave_at_door', label: 'Leave at door', icon: DoorOpen },
  { id: 'dont_ring_bell', label: "Don't ring bell", icon: BellOff },
  { id: 'call_before_arrival', label: 'Call before arrival', icon: PhoneCall },
  { id: 'avoid_calling', label: 'Avoid calling', icon: VolumeX },
  { id: 'pet_at_home', label: 'Pet at home', icon: Sparkles },
];

export function DeliveryAddressSection({
  addresses,
  selectedAddress,
  onSelectAddress,
}: DeliveryAddressSectionProps) {
  const [showModal, setShowModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState<{
    tag: AddressTag;
    house_no: string;
    building_name: string;
    street: string;
    landmark: string;
    city: string;
    state: string;
    zip_code: string;
    lat: string;
    lng: string;
    receiver_name: string;
    receiver_phone: string;
    delivery_instructions: string;
    delivery_preferences: string[];
  }>({
    tag: 'home',
    house_no: '',
    building_name: '',
    street: '',
    landmark: '',
    city: 'Pimpri-Chinchwad',
    state: 'Maharashtra',
    zip_code: '411017',
    lat: '18.6279',
    lng: '73.8009',
    receiver_name: '',
    receiver_phone: '',
    delivery_instructions: '',
    delivery_preferences: [],
  });

  const togglePreference = (prefId: string) => {
    setForm((prev) => ({
      ...prev,
      delivery_preferences: prev.delivery_preferences.includes(prefId)
        ? prev.delivery_preferences.filter((p) => p !== prefId)
        : [...prev.delivery_preferences, prefId],
    }));
  };

  const handleSelectFromMap = (loc: AccurateLocationResult) => {
    setForm((prev) => ({
      ...prev,
      street: loc.details.street || loc.details.full_address || loc.details.locality || prev.street || 'Main Road',
      building_name: prev.building_name || loc.details.building || '',
      city: loc.details.city || 'Pimpri-Chinchwad',
      state: loc.details.state || 'Maharashtra',
      zip_code: loc.details.zip_code || '411017',
      lat: loc.lat.toString(),
      lng: loc.lng.toString(),
    }));
    toast({
      title: 'Location Pinned on Map',
      description: `Mapped: ${loc.details.locality || 'Pimpri-Chinchwad'}. GPS coordinates updated.`,
    });
  };

  const handleAutoDetectLocation = async () => {
    setIsDetecting(true);
    try {
      const loc = await getAccurateLocation();
      setForm((prev) => ({
        ...prev,
        street: loc.details.street || loc.details.full_address || loc.details.locality || prev.street || 'Main Road',
        building_name: prev.building_name || loc.details.building || '',
        city: loc.details.city || 'Pimpri-Chinchwad',
        state: loc.details.state || 'Maharashtra',
        zip_code: loc.details.zip_code || '411017',
        lat: loc.lat.toString(),
        lng: loc.lng.toString(),
      }));
      toast({
        title: 'GPS Location Detected',
        description: `Accurate within ±${Math.round(loc.accuracy)}m. Location auto-filled.`,
      });
    } catch (err: any) {
      toast({
        title: 'Location Detection Failed',
        description: err.message || 'Could not access GPS location',
        variant: 'destructive',
      });
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSaveInlineAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.house_no.trim() || !form.street.trim() || !form.city.trim() || !form.zip_code.trim()) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please provide Flat/House No., Area/Street, City, and Pincode.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    // Build human-friendly composite street string for full backward-compatibility
    const parts: string[] = [];
    if (form.house_no.trim()) parts.push(form.house_no.trim());
    if (form.building_name.trim()) parts.push(form.building_name.trim());
    if (form.street.trim()) parts.push(form.street.trim());
    if (form.landmark.trim()) parts.push(`Near ${form.landmark.trim()}`);
    const combinedStreet = parts.join(', ');

    const newAddress: Address = {
      street: combinedStreet,
      city: form.city.trim(),
      state: form.state.trim(),
      zip_code: form.zip_code.trim(),
      coordinates: {
        lat: parseFloat(form.lat) || 18.6279,
        lng: parseFloat(form.lng) || 73.8009,
      },
      house_no: form.house_no.trim(),
      building_name: form.building_name.trim(),
      landmark: form.landmark.trim(),
      tag: form.tag,
      receiver_name: form.receiver_name.trim(),
      receiver_phone: form.receiver_phone.trim(),
      delivery_instructions: form.delivery_instructions.trim(),
      delivery_preferences: form.delivery_preferences,
    };

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: newAddress }),
      });

      if (!res.ok) throw new Error('Failed to save address');

      onSelectAddress(newAddress);
      setShowModal(false);
      toast({
        title: 'Address Saved & Selected',
        description: `${form.tag.toUpperCase()} delivery destination confirmed for your order.`,
      });
    } catch (err: any) {
      toast({
        title: 'Error Saving Address',
        description: err.message || 'Could not save address',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getTagIcon = (tag?: string) => {
    switch (tag) {
      case 'work':
        return <Briefcase className="w-4 h-4 text-blue-600" />;
      case 'friends_family':
        return <Users className="w-4 h-4 text-emerald-600" />;
      case 'other':
        return <MapPin className="w-4 h-4 text-purple-600" />;
      case 'home':
      default:
        return <Home className="w-4 h-4 text-orange-600" />;
    }
  };

  const getTagBadge = (tag?: string) => {
    switch (tag) {
      case 'work':
        return <Badge className="bg-blue-100 text-blue-800 border-none font-black text-[0.6rem] uppercase tracking-wider">WORK</Badge>;
      case 'friends_family':
        return <Badge className="bg-emerald-100 text-emerald-800 border-none font-black text-[0.6rem] uppercase tracking-wider">FRIENDS & FAMILY</Badge>;
      case 'other':
        return <Badge className="bg-purple-100 text-purple-800 border-none font-black text-[0.6rem] uppercase tracking-wider">OTHER</Badge>;
      case 'home':
      default:
        return <Badge className="bg-orange-100 text-orange-800 border-none font-black text-[0.6rem] uppercase tracking-wider">HOME</Badge>;
    }
  };

  return (
    <>
      <LocationSelectorModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        onSelectLocation={handleSelectFromMap}
      />

      <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-[#1A1A1A] text-white p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-lg font-black tracking-tight">
              <div className="bg-orange-500/20 p-2 rounded-xl text-orange-400">
                <MapPin className="h-5 w-5" />
              </div>
              Delivery Address
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowModal(true)}
              className="text-xs text-orange-400 hover:text-orange-300 font-bold uppercase tracking-widest flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add New Address
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {addresses.length === 0 && !selectedAddress ? (
            <div className="text-center py-10 bg-orange-50/50 rounded-3xl border border-dashed border-orange-200 p-8">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
                <MapPin className="h-7 w-7 animate-bounce" />
              </div>
              <p className="text-base font-black text-gray-900 mb-1">No Delivery Address Added</p>
              <p className="text-xs text-gray-500 mb-6 font-medium max-w-sm mx-auto">
                Add your exact house number, building, landmark, and rider instructions just like Swiggy & Zomato.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  onClick={() => setShowModal(true)}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl text-xs uppercase tracking-widest px-6 h-11 shadow-lg shadow-orange-600/20"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Add Detailed Address
                </Button>
                <Button
                  onClick={() => setShowMapModal(true)}
                  variant="outline"
                  className="border-orange-200 text-orange-700 hover:bg-orange-50 font-black rounded-xl text-xs uppercase tracking-widest px-5 h-11 flex items-center gap-1.5"
                >
                  <Map className="w-4 h-4" /> Pick On Map
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((address, index) => {
                const isSelected = selectedAddress?.street === address.street;
                return (
                  <div
                    key={index}
                    onClick={() => onSelectAddress(address)}
                    className={`relative flex flex-col gap-3 rounded-2xl p-5 border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/30 shadow-md ring-2 ring-orange-500/20'
                        : 'border-gray-100 bg-gray-50/60 hover:bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    {/* Header Row: Tag Badge & Selection Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-white shadow-xs border border-gray-100">
                          {getTagIcon(address.tag)}
                        </div>
                        {getTagBadge(address.tag)}
                        {address.building_name && (
                          <span className="text-xs font-black text-gray-800 uppercase tracking-tight">
                            {address.building_name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-[0.65rem] font-black text-orange-600 uppercase tracking-widest bg-orange-100/80 px-2.5 py-1 rounded-full">
                            <Check className="w-3 h-3" /> Selected
                          </span>
                        ) : (
                          <span className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-wider">
                            Click to Select
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Address Body */}
                    <div className="space-y-1">
                      {address.house_no && (
                        <p className="text-sm font-black text-gray-900 leading-snug">
                          {address.house_no}
                          {address.building_name ? `, ${address.building_name}` : ''}
                        </p>
                      )}
                      <p className="text-xs text-gray-700 font-medium leading-relaxed">
                        {address.street}
                      </p>
                      {address.landmark && (
                        <p className="text-xs text-orange-700 font-semibold flex items-center gap-1.5 pt-0.5">
                          <Flag className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <span>Landmark: {address.landmark}</span>
                        </p>
                      )}
                      <p className="text-[0.7rem] text-gray-500 font-bold uppercase tracking-wide pt-0.5">
                        {address.city}, {address.state} - {address.zip_code}
                      </p>
                    </div>

                    {/* Receiver Contact Info (if available) */}
                    {(address.receiver_name || address.receiver_phone) && (
                      <div className="flex items-center gap-4 text-xs font-semibold text-gray-600 bg-white/80 p-2.5 rounded-xl border border-gray-100">
                        {address.receiver_name && (
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            {address.receiver_name}
                          </span>
                        )}
                        {address.receiver_phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {address.receiver_phone}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Delivery Preferences Chips */}
                    {address.delivery_preferences && address.delivery_preferences.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {address.delivery_preferences.map((pref) => {
                          const matched = DELIVERY_PREFERENCES.find((p) => p.id === pref);
                          if (!matched) return null;
                          const IconComponent = matched.icon;
                          return (
                            <span
                              key={pref}
                              className="inline-flex items-center gap-1 text-[0.6rem] font-bold text-gray-600 bg-white px-2 py-0.5 rounded-md border border-gray-200"
                            >
                              <IconComponent className="w-3 h-3 text-orange-500" />
                              {matched.label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>

        {/* ── SWIGGY / ZOMATO STYLE COMPREHENSIVE ADDRESS MODAL ── */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white rounded-[2.5rem] max-w-lg w-full p-6 md:p-8 shadow-2xl relative border border-gray-100 animate-in zoom-in-95 duration-300 max-h-[92vh] overflow-y-auto">
              {/* Close Button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-6 right-6 p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title Header */}
              <div className="flex items-center gap-3.5 mb-6">
                <div className="bg-orange-100 p-3.5 rounded-2xl text-orange-600 shadow-inner">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Enter Complete Address</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Precision delivery details</p>
                </div>
              </div>

              {/* Location Pin & Quick Actions Bar */}
              <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-3.5 mb-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-black text-gray-800 uppercase tracking-wider">
                      {form.city || 'Pune'} (GPS: {parseFloat(form.lat).toFixed(3)}, {parseFloat(form.lng).toFixed(3)})
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowMapModal(true)}
                    className="h-9 rounded-xl bg-white border-orange-200 text-orange-700 hover:bg-orange-100 font-black uppercase text-[0.65rem] tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <Map className="w-3.5 h-3.5 text-orange-600" />
                    Change on Map
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAutoDetectLocation}
                    disabled={isDetecting}
                    className="h-9 rounded-xl bg-white border-gray-200 text-gray-700 hover:bg-gray-100 font-black uppercase text-[0.65rem] tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    {isDetecting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-600" />
                    ) : (
                      <Crosshair className="w-3.5 h-3.5 text-orange-600" />
                    )}
                    {isDetecting ? 'Detecting...' : 'Current GPS'}
                  </Button>
                </div>
              </div>

              <form onSubmit={handleSaveInlineAddress} className="space-y-4">
                {/* 1. Address Category / Tag (Swiggy / Zomato Signature Pills) */}
                <div className="space-y-2">
                  <Label className="text-[0.65rem] font-black uppercase text-gray-400 tracking-wider">
                    Save Address As *
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ADDRESS_TAGS.map((tag) => {
                      const IconComponent = tag.icon;
                      const isActive = form.tag === tag.id;
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => setForm({ ...form, tag: tag.id })}
                          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all cursor-pointer ${
                            isActive
                              ? 'border-orange-500 bg-orange-600 text-white shadow-md shadow-orange-600/20'
                              : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                          <span>{tag.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Flat / House No. & Building / Apartment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[0.65rem] font-black uppercase text-gray-400 tracking-wider">
                      House / Flat / Floor No. *
                    </Label>
                    <input
                      type="text"
                      placeholder="e.g. Flat 402, 4th Floor"
                      value={form.house_no}
                      onChange={(e) => setForm({ ...form, house_no: e.target.value })}
                      className="w-full mt-1.5 p-3 text-xs font-bold bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-[0.65rem] font-black uppercase text-gray-400 tracking-wider">
                      Building / Apartment Name
                    </Label>
                    <input
                      type="text"
                      placeholder="e.g. Sukhwani Enclave"
                      value={form.building_name}
                      onChange={(e) => setForm({ ...form, building_name: e.target.value })}
                      className="w-full mt-1.5 p-3 text-xs font-bold bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* 3. Street / Area / Locality */}
                <div>
                  <Label className="text-[0.65rem] font-black uppercase text-gray-400 tracking-wider">
                    Area / Street / Locality *
                  </Label>
                  <input
                    type="text"
                    placeholder="e.g. Datta Mandir Road, Wakad"
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                    className="w-full mt-1.5 p-3 text-xs font-bold bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    required
                  />
                </div>

                {/* 4. Nearby Landmark */}
                <div>
                  <Label className="text-[0.65rem] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1">
                    <Flag className="w-3 h-3 text-orange-500" /> Nearby Landmark (Helps Rider Find You)
                  </Label>
                  <input
                    type="text"
                    placeholder="e.g. Opposite D-Mart, Behind Axis Bank ATM"
                    value={form.landmark}
                    onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                    className="w-full mt-1.5 p-3 text-xs font-bold bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                {/* 5. City, State & Pincode (3 Columns) */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-[0.65rem] font-black uppercase text-gray-400 tracking-wider">City *</Label>
                    <input
                      type="text"
                      placeholder="Pimpri-Chinchwad"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full mt-1.5 p-3 text-xs font-bold bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-[0.65rem] font-black uppercase text-gray-400 tracking-wider">State *</Label>
                    <input
                      type="text"
                      placeholder="Maharashtra"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="w-full mt-1.5 p-3 text-xs font-bold bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-[0.65rem] font-black uppercase text-gray-400 tracking-wider">Pincode *</Label>
                    <input
                      type="text"
                      placeholder="411017"
                      value={form.zip_code}
                      onChange={(e) => setForm({ ...form, zip_code: e.target.value })}
                      className="w-full mt-1.5 p-3 text-xs font-bold bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      required
                    />
                  </div>
                </div>

                {/* 6. Receiver Details (Contact for Delivery Handover) */}
                <div className="pt-1 border-t border-gray-100">
                  <Label className="text-[0.65rem] font-black uppercase text-gray-400 tracking-wider mb-2 block">
                    Contact for Delivery Handover
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Receiver's Name (e.g. Ayush)"
                        value={form.receiver_name}
                        onChange={(e) => setForm({ ...form, receiver_name: e.target.value })}
                        className="w-full p-2.5 text-xs font-bold bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        placeholder="10-Digit Mobile Number"
                        value={form.receiver_phone}
                        onChange={(e) => setForm({ ...form, receiver_phone: e.target.value })}
                        className="w-full p-2.5 text-xs font-bold bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 7. Rider Delivery Instructions & Preferences (Swiggy / Zomato Chips) */}
                <div className="pt-1 border-t border-gray-100 space-y-2">
                  <Label className="text-[0.65rem] font-black uppercase text-gray-400 tracking-wider block">
                    Delivery Instructions for Rider (Quick Select)
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {DELIVERY_PREFERENCES.map((pref) => {
                      const IconComponent = pref.icon;
                      const isSelected = form.delivery_preferences.includes(pref.id);
                      return (
                        <button
                          key={pref.id}
                          type="button"
                          onClick={() => togglePreference(pref.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[0.65rem] font-black tracking-wide border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-orange-50 border-orange-500 text-orange-600 shadow-xs'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-orange-600' : 'text-gray-400'}`} />
                          <span>{pref.label}</span>
                          {isSelected && <Check className="w-3 h-3 text-orange-600 ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    placeholder="Specific notes (e.g. Ring bell twice, drop with security)"
                    value={form.delivery_instructions}
                    onChange={(e) => setForm({ ...form, delivery_instructions: e.target.value })}
                    className="w-full mt-2 p-2.5 text-xs font-medium bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>

                {/* 8. Action Buttons */}
                <div className="pt-4 flex gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowModal(false)}
                    className="flex-1 rounded-xl text-xs font-black uppercase tracking-wider text-gray-500 hover:bg-gray-100 h-12"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="flex-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-xl shadow-orange-600/25 h-12 cursor-pointer"
                  >
                    {isSaving ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving Destination...
                      </span>
                    ) : (
                      'Save & Deliver Here'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
