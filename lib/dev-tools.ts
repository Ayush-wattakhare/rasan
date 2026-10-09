import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';

/**
 * Dev/demo tooling (seeding, demo users, order simulator) is only available when
 * explicitly switched on and never in production.
 *
 * NODE_ENV is "production" on every Vercel deploy, previews included, so it
 * cannot tell preview and production apart on its own; VERCEL_ENV can.
 */
export function devToolsEnabled(): boolean {
  if (process.env.ENABLE_DEV_TOOLS !== 'true') return false;
  if (process.env.VERCEL_ENV === 'production') return false;
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) return false;
  return true;
}

/** Returns a 404 response when dev tools are disabled, otherwise null. */
export function devToolsGuard(): NextResponse | null {
  return devToolsEnabled() ? null : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

/**
 * Guard for bootstrap routes that create privileged accounts: dev tools must be
 * enabled AND the request must carry the ADMIN_SETUP_SECRET in `x-admin-secret`.
 */
export function setupSecretGuard(request: Request): NextResponse | null {
  const disabled = devToolsGuard();
  if (disabled) return disabled;

  const secret = process.env.ADMIN_SETUP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'ADMIN_SETUP_SECRET is not configured' }, { status: 403 });
  }
  if (!safeEqual(request.headers.get('x-admin-secret') || '', secret)) {
    return NextResponse.json({ error: 'Invalid or missing admin setup secret' }, { status: 401 });
  }
  return null;
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
