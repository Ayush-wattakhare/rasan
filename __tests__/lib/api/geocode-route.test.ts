/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/geocode/route';
import { cache } from '@/lib/utils/cache';

const fetchMock = jest.fn();

beforeEach(() => {
  cache.clear();
  fetchMock.mockReset();
  (global as any).fetch = fetchMock;
});

let ip = 0;
function req(query: string) {
  // A fresh IP per request keeps the per-client rate limit out of the way.
  return new NextRequest(new URL(`https://rasan.test/api/geocode?${query}`), {
    headers: { 'x-forwarded-for': `10.0.0.${++ip}` },
  });
}

function nominatimReply(body: unknown, ok = true) {
  return { ok, status: ok ? 200 : 503, json: async () => body };
}

describe('GET /api/geocode', () => {
  it('rejects requests without q or valid coordinates', async () => {
    expect((await GET(req(''))).status).toBe(400);
    expect((await GET(req('lat=200&lng=79'))).status).toBe(400);
    expect((await GET(req('lat=abc&lng=79'))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reverse geocodes a Nagpur pin into city and locality', async () => {
    fetchMock.mockResolvedValue(
      nominatimReply({
        display_name: 'Sitabuldi, Nagpur, Maharashtra, 440012, India',
        address: { suburb: 'Sitabuldi', city: 'Nagpur', state: 'Maharashtra', postcode: '440012', road: 'Main Road' },
      })
    );
    const res = await GET(req('lat=21.20118&lng=79.06765'));
    expect(res.status).toBe(200);
    const { details } = await res.json();
    expect(details).toMatchObject({ locality: 'Sitabuldi', city: 'Nagpur', state: 'Maharashtra', zip_code: '440012' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/reverse?');
    expect(init.headers['User-Agent']).toMatch(/^Rasan\//);
  });

  it('caches nearby reverse lookups', async () => {
    fetchMock.mockResolvedValue(nominatimReply({ address: { city: 'Nagpur' } }));
    await GET(req('lat=21.20118&lng=79.06765'));
    await GET(req('lat=21.20121&lng=79.06768'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns 502 when Nominatim fails', async () => {
    fetchMock.mockResolvedValue(nominatimReply({}, false));
    expect((await GET(req('lat=21.2&lng=79.06'))).status).toBe(502);
  });

  it('searches with a viewbox bias around the pin', async () => {
    fetchMock.mockResolvedValue(
      nominatimReply([
        { display_name: 'Dharampeth, Nagpur', lat: '21.14', lon: '79.07', address: { suburb: 'Dharampeth', city: 'Nagpur' } },
        { display_name: 'Broken', lat: 'x', lon: 'y', address: {} },
      ])
    );
    const res = await GET(req('q=dharampeth&lat=21.2&lng=79.06'));
    const { results } = await res.json();
    expect(results).toEqual([
      { display_name: 'Dharampeth, Nagpur', lat: 21.14, lng: 79.07, locality: 'Dharampeth', city: 'Nagpur' },
    ]);
    expect(fetchMock.mock.calls[0][0]).toContain('viewbox=');
    expect(fetchMock.mock.calls[0][0]).toContain('countrycodes=in');
  });

  it('ignores one-character searches', async () => {
    const res = await GET(req('q=a'));
    expect(await res.json()).toEqual({ results: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
