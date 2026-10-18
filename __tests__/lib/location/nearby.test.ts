/**
 * @jest-environment node
 */
import { parseLocationCookie, serializeLocationCookie } from '@/lib/location/location-cookie';
import { deliveryRange } from '@/lib/location/delivery-range';
import { formatDistance, getServiceArea, isPreviewArea } from '@/lib/location/nearby';

const NAGPUR = { lat: 21.1458, lng: 79.0882, city: 'Nagpur' };
const PIMPRI = { lat: 18.6279, lng: 73.8009, city: 'Pimpri' };
// A kitchen pinned in Wakad (~4.5 km from Pimpri, ~690 km from Nagpur), as hex EWKB.
function ewkb(lng: number, lat: number) {
  const buf = new DataView(new ArrayBuffer(25));
  buf.setUint8(0, 1);
  buf.setUint32(1, 0x20000001, true);
  buf.setUint32(5, 4326, true);
  buf.setFloat64(9, lng, true);
  buf.setFloat64(17, lat, true);
  return Array.from(new Uint8Array(buf.buffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
const WAKAD_KITCHEN = ewkb(73.7667, 18.5987);

function supabaseWith(rpcResult: { data?: unknown; error?: { message: string } | null }) {
  return { rpc: jest.fn().mockResolvedValue({ data: rpcResult.data ?? null, error: rpcResult.error ?? null }) } as any;
}

describe('location cookie', () => {
  it('round-trips a location', () => {
    const raw = serializeLocationCookie(NAGPUR);
    expect(parseLocationCookie(raw)).toEqual(NAGPUR);
  });

  it('treats malformed or tampered values as "no location"', () => {
    expect(parseLocationCookie(undefined)).toBeNull();
    expect(parseLocationCookie('not-json')).toBeNull();
    expect(parseLocationCookie(encodeURIComponent('{"lat":"x","lng":1}'))).toBeNull();
    expect(parseLocationCookie(encodeURIComponent('{"lat":200,"lng":1}'))).toBeNull();
    expect(parseLocationCookie(encodeURIComponent('{"lat":0,"lng":0}'))).toBeNull();
    const xss = parseLocationCookie(encodeURIComponent('{"lat":21,"lng":79,"city":"<script>x"}'));
    expect(xss?.city).toBe('scriptx');
  });
});

describe('getServiceArea', () => {
  it('no cookie -> no-location (nothing listed, no database call)', async () => {
    const sb = supabaseWith({ data: [] });
    expect(await getServiceArea(sb, null)).toEqual({ status: 'no-location' });
    expect(sb.rpc).not.toHaveBeenCalled();
  });

  it('Nagpur with no kitchens in range -> unavailable (never Pune kitchens)', async () => {
    const sb = supabaseWith({ data: [] });
    const area = await getServiceArea(sb, NAGPUR);
    expect(area).toEqual({ status: 'unavailable', location: NAGPUR, reason: 'none-in-range' });
    expect(sb.rpc).toHaveBeenCalledWith('nearby_kitchens', { user_lat: NAGPUR.lat, user_lng: NAGPUR.lng, radius_km: 10 });
  });

  it('lookup error (e.g. migration 007 missing) -> empty state, not an unfiltered list', async () => {
    const sb = supabaseWith({ error: { message: 'function nearby_kitchens does not exist' } });
    const area = await getServiceArea(sb, PIMPRI);
    expect(area).toMatchObject({ status: 'unavailable', reason: 'lookup-failed' });
  });

  it('kitchens in range -> available, with numeric distances', async () => {
    const sb = supabaseWith({ data: [{ id: 'k1', business_name: 'Wakad Kitchen', rating: '4.50', total_orders: 3, distance_km: '4.47' }] });
    const area = await getServiceArea(sb, PIMPRI);
    expect(area.status).toBe('available');
    if (area.status === 'available') {
      expect(area.kitchens[0]).toMatchObject({ id: 'k1', rating: 4.5, distance_km: 4.47 });
    }
  });
});

describe('deliveryRange (detail pages)', () => {
  it('a Pune kitchen does not deliver to Nagpur', () => {
    const r = deliveryRange(NAGPUR, WAKAD_KITCHEN);
    expect(r.status).toBe('out-of-range');
    if (r.status === 'out-of-range') expect(r.distanceKm).toBeGreaterThan(600);
  });

  it('a Wakad kitchen delivers to Pimpri', () => {
    expect(deliveryRange(PIMPRI, WAKAD_KITCHEN).status).toBe('in-range');
  });

  it('unknown without a customer location or with a placeholder kitchen pin', () => {
    expect(deliveryRange(null, WAKAD_KITCHEN).status).toBe('unknown');
    expect(deliveryRange(PIMPRI, 'POINT(72.8777 19.0760)').status).toBe('unknown');
  });
});

describe('helpers', () => {
  it('formats distances', () => {
    expect(formatDistance(4.47)).toBe('4.5 km away');
    expect(formatDistance(0.34)).toBe('300 m away');
  });

  it('only known preview areas are accepted', () => {
    expect(isPreviewArea('pune')).toBe(true);
    expect(isPreviewArea('mumbai')).toBe(false);
    expect(isPreviewArea(undefined)).toBe(false);
  });
});
