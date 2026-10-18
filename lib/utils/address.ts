/**
 * Whitelisting for address JSON stored on profiles, orders and subscriptions.
 * Unknown keys are dropped, strings are trimmed and length-capped, and
 * coordinates (optional) must be real numbers in range.
 */

const ADDRESS_TEXT_FIELDS: Record<string, number> = {
  street: 300,
  city: 100,
  state: 100,
  zip_code: 12,
  house_no: 50,
  building_name: 120,
  landmark: 120,
  tag: 20,
  receiver_name: 100,
  receiver_phone: 20,
  phone: 20,
  delivery_instructions: 500,
};

export type SanitizedAddress = Record<string, unknown> & {
  street: string;
  coordinates?: { lat: number; lng: number };
};

export function sanitizeAddressFields(
  raw: unknown,
  required: readonly string[] = ['street']
): { address: SanitizedAddress } | { error: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { error: 'Invalid address format' };
  }
  const a = raw as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const [key, max] of Object.entries(ADDRESS_TEXT_FIELDS)) {
    if (typeof a[key] === 'string') {
      const value = (a[key] as string).trim().slice(0, max);
      if (value) out[key] = value;
    }
  }

  const missing = required.filter((k) => !out[k]);
  if (missing.length > 0) {
    return { error: `Address is missing: ${missing.join(', ').replace(/_/g, ' ')}` };
  }

  if (Array.isArray(a.delivery_preferences)) {
    out.delivery_preferences = a.delivery_preferences
      .filter((p): p is string => typeof p === 'string')
      .slice(0, 10)
      .map((p) => p.slice(0, 40));
  }

  if (a.coordinates != null) {
    const c = a.coordinates as Record<string, unknown>;
    const lat = Number(c?.lat);
    const lng = Number(c?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return { error: 'Invalid coordinates' };
    }
    out.coordinates = { lat, lng };
  }

  return { address: out as SanitizedAddress };
}

/** Delivery address for an order / subscription: needs at least a street. */
export function sanitizeDeliveryAddress(raw: unknown): SanitizedAddress | null {
  const result = sanitizeAddressFields(raw, ['street']);
  return 'address' in result ? result.address : null;
}
