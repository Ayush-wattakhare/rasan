export interface LatLng {
  lat: number;
  lng: number;
}

function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    // (0,0) is never a real delivery point here; treat it as "not set".
    !(lat === 0 && lng === 0)
  );
}

function fromLngLat(lng: number, lat: number): LatLng | null {
  return isValidLatLng(lat, lng) ? { lat, lng } : null;
}

/** Parses a hex-encoded (E)WKB point, the format PostgREST/Supabase returns for GEOGRAPHY columns. */
function parseHexWkbPoint(hex: string): LatLng | null {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length < 42 || hex.length % 2 !== 0) return null;

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  const view = new DataView(bytes.buffer);
  const littleEndian = bytes[0] === 1;
  let offset = 1;

  const rawType = view.getUint32(offset, littleEndian);
  offset += 4;

  const hasSrid = (rawType & 0x20000000) !== 0;
  // Strip EWKB flags (Z/M/SRID) and ISO Z/M offsets (1001, 2001, 3001).
  const baseType = (rawType & 0x0fffffff) % 1000;
  if (baseType !== 1) return null; // not a POINT

  if (hasSrid) offset += 4;
  if (bytes.length < offset + 16) return null;

  const x = view.getFloat64(offset, littleEndian);
  const y = view.getFloat64(offset + 8, littleEndian);
  return fromLngLat(x, y);
}

/**
 * Normalises any PostGIS point representation into `{ lat, lng }`:
 * - hex EWKB (Supabase default for geography columns)
 * - WKT / EWKT: `POINT(lng lat)`, `SRID=4326;POINT(lng lat)`
 * - GeoJSON object or string: `{ type: 'Point', coordinates: [lng, lat] }`
 * - plain `{ lat, lng }` objects
 * Returns null when the value is missing or unparseable.
 */
export function parsePointLocation(value: unknown): LatLng | null {
  if (value == null) return null;

  if (typeof value === 'object') {
    const obj = value as Record<string, any>;
    if (Array.isArray(obj.coordinates) && obj.coordinates.length >= 2) {
      return fromLngLat(Number(obj.coordinates[0]), Number(obj.coordinates[1]));
    }
    if (obj.lat != null && obj.lng != null) {
      return fromLngLat(Number(obj.lng), Number(obj.lat));
    }
    return null;
  }

  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text) return null;

  if (text.startsWith('{')) {
    try {
      return parsePointLocation(JSON.parse(text));
    } catch {
      return null;
    }
  }

  const wkt = text.match(/POINT\s*Z?\s*\(\s*(-?[\d.]+(?:e-?\d+)?)\s+(-?[\d.]+(?:e-?\d+)?)/i);
  if (wkt) return fromLngLat(parseFloat(wkt[1]), parseFloat(wkt[2]));

  return parseHexWkbPoint(text);
}

/** Extracts customer coordinates from an order/profile address JSON blob. */
export function coordsFromAddress(address: unknown): LatLng | null {
  if (!address || typeof address !== 'object') return null;
  const a = address as Record<string, any>;
  if (a.coordinates) {
    const c = parsePointLocation(a.coordinates);
    if (c) return c;
  }
  if (a.lat != null && a.lng != null) return fromLngLat(Number(a.lng), Number(a.lat));
  if (a.latitude != null && a.longitude != null) {
    return fromLngLat(Number(a.longitude), Number(a.latitude));
  }
  return null;
}

/**
 * `vendors.location` is NOT NULL, so sign-up/admin flows insert this placeholder
 * (Mumbai centre) until the chef pins their kitchen. Treat it as "not set" so it
 * never drives distance checks or maps.
 */
export const PLACEHOLDER_VENDOR_LOCATION: LatLng = { lat: 19.076, lng: 72.8777 };

/** Placeholders written by older code paths (Mumbai centre, Pune centre). */
const KNOWN_PLACEHOLDERS: LatLng[] = [PLACEHOLDER_VENDOR_LOCATION, { lat: 18.5204, lng: 73.8567 }];

/** Like parsePointLocation, but returns null for sign-up placeholder points. */
export function parseVendorLocation(value: unknown): LatLng | null {
  const p = parsePointLocation(value);
  if (!p) return null;
  const isPlaceholder = KNOWN_PLACEHOLDERS.some(
    (ph) => Math.abs(p.lat - ph.lat) < 1e-6 && Math.abs(p.lng - ph.lng) < 1e-6
  );
  return isPlaceholder ? null : p;
}
