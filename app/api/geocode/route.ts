import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/utils/rate-limit';
import { cache } from '@/lib/utils/cache';

/**
 * Address lookup for the location picker, proxied to OpenStreetMap Nominatim.
 *
 *   GET /api/geocode?lat=21.14&lng=79.08         -> reverse geocode (address for a pin)
 *   GET /api/geocode?q=sitabuldi&lat=..&lng=..   -> search (biased towards lat/lng)
 *
 * Calling Nominatim from the server lets us send an identifying User-Agent
 * (required by its usage policy), apply a timeout, cache results and rate
 * limit per client. Browser calls were often blocked or throttled, which left
 * pins named just "Pinned location".
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const USER_AGENT = `Rasan/1.0 (${process.env.NEXT_PUBLIC_APP_URL || 'https://rasan.app'})`;
const TIMEOUT_MS = 6000;
const CACHE_TTL_S = 60 * 60; // addresses rarely change

function clientKey(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'anon';
}

function validCoord(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

async function nominatim(path: string) {
  const res = await fetch(`${NOMINATIM}${path}`, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en-IN,en', Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  return res.json();
}

function toDetails(data: any, lat: number, lng: number) {
  const addr = data?.address || {};
  const road = addr.road || addr.street || addr.pedestrian || addr.path || '';
  const house = addr.house_number || '';
  const city = addr.city || addr.town || addr.village || addr.city_district || addr.county || addr.state_district || '';
  const locality =
    addr.suburb || addr.neighbourhood || addr.quarter || addr.residential || addr.city_district || addr.hamlet || city || '';
  return {
    street: [house, road].filter(Boolean).join(' ') || addr.suburb || addr.neighbourhood || '',
    city,
    state: addr.state || addr.region || '',
    zip_code: addr.postcode || '',
    locality,
    building: addr.building || addr.amenity || addr.shop || '',
    landmark: addr.amenity || addr.shop || '',
    full_address: data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
  };
}

export async function GET(request: NextRequest) {
  const limit = rateLimit(`geocode:${clientKey(request)}`, { interval: 60_000, maxRequests: 40 });
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many location lookups. Please wait a moment.' }, { status: 429 });
  }

  const sp = request.nextUrl.searchParams;
  const q = (sp.get('q') || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  const lat = Number(sp.get('lat'));
  const lng = Number(sp.get('lng'));
  const hasCoords = sp.has('lat') && sp.has('lng') && validCoord(lat, lng);

  try {
    // ── Search ──
    if (q) {
      if (q.length < 2) return NextResponse.json({ results: [] });
      // Bias (not restrict) results to ~50 km around the current pin.
      const bias = hasCoords
        ? `&viewbox=${lng - 0.5},${lat + 0.5},${lng + 0.5},${lat - 0.5}`
        : '';
      const key = `geo:q:${q.toLowerCase()}:${hasCoords ? `${lat.toFixed(1)},${lng.toFixed(1)}` : '-'}`;
      const results = await cache.getOrSet(
        key,
        async () => {
          const data = await nominatim(
            `/search?format=jsonv2&addressdetails=1&countrycodes=in&limit=8&q=${encodeURIComponent(q)}${bias}`
          );
          return (Array.isArray(data) ? data : []).map((item: any) => {
            const ilat = parseFloat(item.lat);
            const ilng = parseFloat(item.lon);
            const details = toDetails(item, ilat, ilng);
            return {
              display_name: item.display_name as string,
              lat: ilat,
              lng: ilng,
              locality: details.locality || item.name || details.city || 'Location',
              city: details.city,
            };
          }).filter((r: any) => validCoord(r.lat, r.lng));
        },
        CACHE_TTL_S
      );
      return NextResponse.json({ results });
    }

    // ── Reverse ──
    if (!hasCoords) {
      return NextResponse.json({ error: 'Provide q, or lat and lng' }, { status: 400 });
    }
    // ~11 m grid so nearby pins share a cache entry.
    const key = `geo:r:${lat.toFixed(4)},${lng.toFixed(4)}`;
    const details = await cache.getOrSet(
      key,
      async () => toDetails(await nominatim(`/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${lat}&lon=${lng}`), lat, lng),
      CACHE_TTL_S
    );
    return NextResponse.json({ details });
  } catch (error) {
    console.warn('[geocode] lookup failed:', (error as Error)?.message);
    return NextResponse.json({ error: 'Address lookup is unavailable right now' }, { status: 502 });
  }
}
