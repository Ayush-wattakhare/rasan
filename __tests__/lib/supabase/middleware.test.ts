/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

const mockGetUser = jest.fn();
const mockProfileRole = jest.fn();

jest.mock('@supabase/ssr', () => ({
  createServerClient: (_url: string, _key: string, opts: any) => ({
    auth: {
      getUser: async () => {
        // Simulate Supabase rotating the session during verification.
        opts.cookies.setAll([{ name: 'sb-test-auth-token', value: 'rotated', options: { path: '/' } }]);
        return mockGetUser();
      },
    },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: mockProfileRole() }) }) }),
    }),
  }),
}));
jest.mock('@/lib/dev-tools', () => ({ devToolsEnabled: () => false }));

import { updateSession } from '@/lib/supabase/middleware';

function req(path: string, withCookie = true) {
  const r = new NextRequest(new URL(`https://rasan.test${path}`));
  if (withCookie) r.cookies.set('sb-test-auth-token', 'old');
  return r;
}

describe('updateSession', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockProfileRole.mockReset();
  });

  it('keeps refreshed auth cookies on a role redirect', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'customer' } } } });
    const res = await updateSession(req('/vendor-dashboard'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/dashboard');
    expect(res.cookies.get('sb-test-auth-token')?.value).toBe('rotated');
  });

  it('refreshes the session on public pages for signed-in users', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', app_metadata: { role: 'customer' } } } });
    const res = await updateSession(req('/meals'));
    expect(mockGetUser).toHaveBeenCalled();
    expect(res.cookies.get('sb-test-auth-token')?.value).toBe('rotated');
  });

  it('does not call Supabase for anonymous visitors on public pages', async () => {
    await updateSession(req('/meals', false));
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('treats a user with no resolvable role as a customer (never vendor/admin pages)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1', app_metadata: {} } } });
    mockProfileRole.mockReturnValue(null);
    const res = await updateSession(req('/admin-dashboard'));
    expect(res.headers.get('location')).toContain('/dashboard');
  });

  it('sends signed-out users on protected pages to login', async () => {
    const res = await updateSession(req('/orders', false));
    expect(res.headers.get('location')).toContain('/login?redirectTo=%2Forders');
  });
});
