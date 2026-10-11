import { safeRedirectPath } from '@/lib/utils/safe-redirect';

describe('safeRedirectPath', () => {
  it.each([
    ['/orders', '/orders'],
    ['/orders?tab=active', '/orders?tab=active'],
    ['/meals#top', '/meals#top'],
  ])('keeps same-origin path %s', (input, expected) => {
    expect(safeRedirectPath(input)).toBe(expected);
  });

  it.each([
    'https://evil.com',
    '//evil.com',
    '/\\evil.com',
    '@evil.com',
    '.evil.com',
    'evil.com',
    'javascript:alert(1)',
    '/\u0000//evil.com',
    '',
  ])('rejects %p', (input) => {
    expect(safeRedirectPath(input)).toBe('/');
  });

  it('uses the given fallback', () => {
    expect(safeRedirectPath(null, '/dashboard')).toBe('/dashboard');
    expect(safeRedirectPath('//evil.com', '')).toBe('');
  });
});
