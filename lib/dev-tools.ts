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
