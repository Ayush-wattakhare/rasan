/**
 * Returns `path` only if it is a same-origin relative path ("/orders?x=1").
 * Rejects absolute URLs, protocol-relative URLs ("//evil.com"), backslash
 * tricks ("/\\evil.com") and values that would change the host when appended
 * to an origin ("@evil.com", ".evil.com").
 */
export function safeRedirectPath(path: string | null | undefined, fallback = '/'): string {
  if (!path || typeof path !== 'string') return fallback;
  if (!path.startsWith('/')) return fallback;
  if (path.startsWith('//') || path.startsWith('/\\')) return fallback;
  if (/[\u0000-\u001f]/.test(path)) return fallback;

  try {
    const base = 'http://localhost';
    const url = new URL(path, base);
    if (url.origin !== base) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
