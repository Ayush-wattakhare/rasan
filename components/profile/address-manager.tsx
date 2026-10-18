'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MapPin, 
  Home, 
  Briefcase, 
  Navigation, 
  Crosshair, 
  Loader2, 
  Building, 
  Phone, 
  User, 
  Check, 
  Sparkles,
  Compass,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/lib/hooks/use-toast';
import { getAccurateLocation } from '@/lib/hooks/use-location';
import type { Profile } from '@/lib/supabase/types';
import type { Address } from '@/types';

interface AddressManagerProps {
  profile: Profile;
}

type AddressTag = 'home' | 'work' | 'friends_family' | 'other';

const TAG_OPTIONS: { id: AddressTag; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'work', label: 'Work', icon: Briefcase },
  { id: 'other', label: 'Other', icon: MapPin },
];

export default function AddressManager({ profile }: AddressManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(!profile.address);

  const initialAddress = (profile.address as Address | null) || null;

  // Coordinates stay unset until the user detects GPS (never a placeholder point).
  const [formData, setFormData] = useState<Omit<Address, 'coordinates'> & { coordinates?: Address['coordinates'] }>({
    house_no: initialAddress?.house_no || '',
    building_name: initialAddress?.building_name || '',
    street: initialAddress?.street || '',
    landmark: initialAddress?.landmark || '',
    city: initialAddress?.city || '',
    state: initialAddress?.state || '',
    zip_code: initialAddress?.zip_code || '',
    tag: initialAddress?.tag || 'home',
    receiver_name: initialAddress?.receiver_name || profile.name || '',
    receiver_phone: initialAddress?.receiver_phone || profile.phone || '',
    delivery_instructions: initialAddress?.delivery_instructions || '',
    coordinates: initialAddress?.coordinates,
  });

  const [hasCustomGps, setHasCustomGps] = useState(
    Boolean(initialAddress?.coordinates?.lat && initialAddress?.coordinates?.lng)
  );

  // 1-Click GPS Auto-Detection
  const handleAutoDetectLocation = async () => {
    setDetectingLocation(true);
    setError(null);
    try {
      const loc = await getAccurateLocation({ persist: false });
      setFormData((prev) => ({
        ...prev,
        street: loc.details.street || loc.details.locality || loc.details.full_address || prev.street,
        building_name: prev.building_name || loc.details.building || '',
        city: loc.details.city || prev.city,
        state: loc.details.state || prev.state,
        zip_code: loc.details.zip_code || prev.zip_code,
        coordinates: {
          lat: loc.lat,
          lng: loc.lng,
        },
      }));
      setHasCustomGps(true);
      toast({
        title: '📍 GPS Location Detected',
        description: `Auto-filled details for ${loc.details.locality || 'your area'}. Coordinates linked successfully!`,
      });
    } catch (err: any) {
      toast({
        title: 'Location Detection Notice',
        description: err.message || 'Could not fetch GPS location. You can enter your address manually.',
        variant: 'destructive',
      });
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic Indian PIN code validation
    const cleanZip = formData.zip_code.trim();
    if (!/^\d{6}$/.test(cleanZip)) {
      setError('Please enter a valid 6-digit Indian PIN Code (e.g. 411017 or 400001)');
      setLoading(false);
      return;
    }

    // Ensure street address incorporates building/house if street alone is short
    const fullStreetAddress = formData.street.trim() || 
      [formData.house_no, formData.building_name, formData.landmark].filter(Boolean).join(', ') || 
      'Main Road';

    // Never save made-up coordinates: riders and the distance check rely on them.
    const hasCoords = !!(formData.coordinates?.lat && formData.coordinates?.lng);
    const { coordinates, ...rest } = formData;
    const payload = {
      ...rest,
      street: fullStreetAddress,
      zip_code: cleanZip,
      ...(hasCoords ? { coordinates } : {}),
    } as Address;

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: payload }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update address');
      }

      toast({
        title: '✅ Address Saved',
        description: 'Your delivery address has been updated successfully.',
      });

      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving address');
    } finally {
      setLoading(false);
    }
  };

  // Saved Address Read-Only Card
  if (!isEditing && initialAddress) {
    const TagIcon = initialAddress.tag === 'work' ? Briefcase : initialAddress.tag === 'home' ? Home : MapPin;
    const tagLabel = initialAddress.tag === 'work' ? 'Work / Office' : initialAddress.tag === 'home' ? 'Home' : 'Other';

    return (
      <div className="space-y-4 animate-in fade-in duration-200">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-all">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-orange-50 text-orange-700 border border-orange-200">
                <TagIcon className="w-3.5 h-3.5 text-orange-600" />
                {tagLabel}
              </span>
              <Badge variant="outline" className="text-[0.65rem] font-bold text-green-700 border-green-200 bg-green-50">
                Primary Delivery Address
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="rounded-xl text-xs font-bold hover:border-orange-500 hover:text-orange-600"
            >
              Edit Address
            </Button>
          </div>

          <div className="space-y-2 text-sm">
            {/* Flat / Building */}
            {(initialAddress.house_no || initialAddress.building_name) ? (
              <p className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                <Building className="w-4 h-4 text-orange-500 shrink-0" />
                <span>
                  {[initialAddress.house_no, initialAddress.building_name].filter(Boolean).join(', ')}
                </span>
              </p>
            ) : null}

            {/* Street / Locality */}
            <p className="text-gray-700 font-semibold flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <span>{initialAddress.street}</span>
            </p>

            {/* Landmark */}
            {initialAddress.landmark && (
              <p className="text-xs text-orange-800 font-medium pl-6">
                <strong>Landmark:</strong> {initialAddress.landmark}
              </p>
            )}

            {/* City, State, PIN */}
            <p className="text-xs text-gray-500 font-medium pl-6">
              {initialAddress.city}, {initialAddress.state} — <strong className="text-gray-900 font-bold">{initialAddress.zip_code}</strong>
            </p>

            {/* Receiver Contact */}
            {(initialAddress.receiver_name || initialAddress.receiver_phone) && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-600 font-medium pl-1">
                {initialAddress.receiver_name && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    {initialAddress.receiver_name}
                  </span>
                )}
                {initialAddress.receiver_phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    +91 {initialAddress.receiver_phone}
                  </span>
                )}
              </div>
            )}

            {/* Discreet GPS Link */}
            {initialAddress.coordinates?.lat != null && initialAddress.coordinates?.lng != null && (
              <div className="mt-2 flex items-center gap-1.5 text-[0.68rem] text-gray-400">
                <Compass className="w-3 h-3 text-green-500" />
                <span>GPS Location Pinned (Lat: {initialAddress.coordinates.lat.toFixed(3)}, Lng: {initialAddress.coordinates.lng.toFixed(3)})</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Edit / Add Address Form
  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner: GPS Auto-detection button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-orange-50/70 border border-orange-200 rounded-2xl">
        <div className="space-y-0.5">
          <span className="text-xs font-black text-orange-950 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-orange-600" />
            Quick GPS Auto-Detect
          </span>
          <p className="text-[0.7rem] text-orange-800 font-medium">
            Auto-fill your city, area, pincode, and delivery coordinates with one tap.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleAutoDetectLocation}
          disabled={detectingLocation}
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          {detectingLocation ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Detecting GPS...
            </>
          ) : (
            <>
              <Crosshair className="w-3.5 h-3.5" />
              Use Current Location
            </>
          )}
        </Button>
      </div>

      {/* Address Type Tag (Home, Work, Other) */}
      <div className="space-y-2">
        <Label className="text-xs font-black text-gray-800 uppercase tracking-wider">
          Save Address As
        </Label>
        <div className="flex flex-wrap gap-2">
          {TAG_OPTIONS.map((tag) => {
            const Icon = tag.icon;
            const isSelected = formData.tag === tag.id;
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => setFormData({ ...formData, tag: tag.id })}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-orange-600 text-white border-orange-600 shadow-sm scale-[1.02]'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tag.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 1: Flat/House No & Building/Society Name */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="house_no" className="text-xs font-bold text-gray-800">
            Flat / House No. / Floor <span className="text-orange-600">*</span>
          </Label>
          <Input
            id="house_no"
            type="text"
            value={formData.house_no || ''}
            onChange={(e) => setFormData({ ...formData, house_no: e.target.value })}
            required
            placeholder="e.g. Flat 402, 4th Floor / Room 12"
            className="rounded-xl border-gray-200 text-xs font-semibold focus:border-orange-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="building_name" className="text-xs font-bold text-gray-800">
            Building / Society / Apartment Name <span className="text-orange-600">*</span>
          </Label>
          <Input
            id="building_name"
            type="text"
            value={formData.building_name || ''}
            onChange={(e) => setFormData({ ...formData, building_name: e.target.value })}
            required
            placeholder="e.g. Silver Oak Society / Sunshine Heights"
            className="rounded-xl border-gray-200 text-xs font-semibold focus:border-orange-500"
          />
        </div>
      </div>

      {/* Row 2: Street / Area & Nearby Landmark */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="street" className="text-xs font-bold text-gray-800">
            Street / Area / Locality <span className="text-orange-600">*</span>
          </Label>
          <Input
            id="street"
            type="text"
            value={formData.street}
            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
            required
            placeholder="e.g. Rahatani Gaon Road, Near D-Mart"
            className="rounded-xl border-gray-200 text-xs font-semibold focus:border-orange-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="landmark" className="text-xs font-bold text-gray-800">
            Nearby Landmark <span className="text-gray-400 font-normal">(Helpful for delivery)</span>
          </Label>
          <Input
            id="landmark"
            type="text"
            value={formData.landmark || ''}
            onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
            placeholder="e.g. Opposite Ganesh Temple / Near Metro Pillar 42"
            className="rounded-xl border-gray-200 text-xs font-semibold focus:border-orange-500"
          />
        </div>
      </div>

      {/* Row 3: City, State, 6-digit PIN Code */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="city" className="text-xs font-bold text-gray-800">
            City <span className="text-orange-600">*</span>
          </Label>
          <Input
            id="city"
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
            placeholder="e.g. Pimpri-Chinchwad / Pune"
            className="rounded-xl border-gray-200 text-xs font-semibold focus:border-orange-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="state" className="text-xs font-bold text-gray-800">
            State <span className="text-orange-600">*</span>
          </Label>
          <Input
            id="state"
            type="text"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            required
            placeholder="Maharashtra"
            className="rounded-xl border-gray-200 text-xs font-semibold focus:border-orange-500"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="zip_code" className="text-xs font-bold text-gray-800">
            PIN Code (6 digits) <span className="text-orange-600">*</span>
          </Label>
          <Input
            id="zip_code"
            type="text"
            maxLength={6}
            value={formData.zip_code}
            onChange={(e) => setFormData({ ...formData, zip_code: e.target.value.replace(/\D/g, '') })}
            required
            placeholder="411017"
            className="rounded-xl border-gray-200 text-xs font-bold focus:border-orange-500 tracking-wider"
          />
        </div>
      </div>

      {/* Row 4: Optional Receiver Contact Information */}
      <div className="p-4 bg-gray-50/70 border border-gray-100 rounded-2xl space-y-3">
        <span className="text-xs font-bold text-gray-800 block">
          Contact Details for Delivery Rider (Optional)
        </span>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="receiver_name" className="text-[0.7rem] font-bold text-gray-600">
              Contact Person Name
            </Label>
            <Input
              id="receiver_name"
              type="text"
              value={formData.receiver_name || ''}
              onChange={(e) => setFormData({ ...formData, receiver_name: e.target.value })}
              placeholder="e.g. Ayush / Self"
              className="bg-white rounded-xl border-gray-200 text-xs font-medium focus:border-orange-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="receiver_phone" className="text-[0.7rem] font-bold text-gray-600">
              10-Digit Phone Number
            </Label>
            <Input
              id="receiver_phone"
              type="tel"
              maxLength={10}
              value={formData.receiver_phone || ''}
              onChange={(e) => setFormData({ ...formData, receiver_phone: e.target.value.replace(/\D/g, '') })}
              placeholder="e.g. 9876543210"
              className="bg-white rounded-xl border-gray-200 text-xs font-medium focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* GPS Status Indicator (No raw lat/lng inputs!) */}
      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
        <Compass className={`w-3.5 h-3.5 ${hasCustomGps ? 'text-green-600' : 'text-gray-400'}`} />
        <span>
          {hasCustomGps
            ? 'GPS location linked for accurate doorstep food delivery.'
            : 'City-level coordinates automatically mapped in background.'}
        </span>
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 p-3 text-xs font-bold text-destructive">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black px-6 py-2.5 shadow-sm cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              Saving Address...
            </>
          ) : (
            'Save Delivery Address'
          )}
        </Button>
        {profile.address && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditing(false)}
            className="rounded-xl text-xs font-bold"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
