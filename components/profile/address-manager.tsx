'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { Profile } from '@/lib/supabase/types';
import type { Address } from '@/types';

interface AddressManagerProps {
  profile: Profile;
}

export default function AddressManager({ profile }: AddressManagerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(!profile.address);

  const [formData, setFormData] = useState<Address>(
    profile.address || {
      street: '',
      city: '',
      state: '',
      zip_code: '',
      coordinates: { lat: 0, lng: 0 },
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate coordinates
      if (
        formData.coordinates.lat < -90 ||
        formData.coordinates.lat > 90 ||
        formData.coordinates.lng < -180 ||
        formData.coordinates.lng > 180
      ) {
        throw new Error('Invalid coordinates');
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: formData }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update address');
      }

      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isEditing && profile.address) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <div className="mb-2 flex items-center justify-between">
            <Badge>Primary Address</Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          </div>
          <div className="space-y-1 text-sm">
            <p className="font-medium">{profile.address.street}</p>
            <p className="text-muted-foreground">
              {profile.address.city}, {profile.address.state}{' '}
              {profile.address.zip_code}
            </p>
            <p className="text-xs text-muted-foreground">
              Coordinates: {profile.address.coordinates.lat.toFixed(4)},{' '}
              {profile.address.coordinates.lng.toFixed(4)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="street">Street Address</Label>
        <Input
          id="street"
          type="text"
          value={formData.street}
          onChange={(e) =>
            setFormData({ ...formData, street: e.target.value })
          }
          required
          placeholder="123 Main Street"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
            placeholder="Mumbai"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            type="text"
            value={formData.state}
            onChange={(e) =>
              setFormData({ ...formData, state: e.target.value })
            }
            required
            placeholder="Maharashtra"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="zip_code">ZIP Code</Label>
        <Input
          id="zip_code"
          type="text"
          value={formData.zip_code}
          onChange={(e) =>
            setFormData({ ...formData, zip_code: e.target.value })
          }
          required
          placeholder="400001"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lat">Latitude</Label>
          <Input
            id="lat"
            type="number"
            step="any"
            value={formData.coordinates.lat}
            onChange={(e) =>
              setFormData({
                ...formData,
                coordinates: {
                  ...formData.coordinates,
                  lat: parseFloat(e.target.value) || 0,
                },
              })
            }
            required
            placeholder="19.0760"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lng">Longitude</Label>
          <Input
            id="lng"
            type="number"
            step="any"
            value={formData.coordinates.lng}
            onChange={(e) =>
              setFormData({
                ...formData,
                coordinates: {
                  ...formData.coordinates,
                  lng: parseFloat(e.target.value) || 0,
                },
              })
            }
            required
            placeholder="72.8777"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        You can use a geocoding service to find coordinates for your address.
      </p>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Address'}
        </Button>
        {profile.address && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
