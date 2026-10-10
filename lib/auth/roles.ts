import type { UserRole } from '@/types';

/**
 * Single source of truth for role-based page access.
 * Used by the middleware (lib/supabase/middleware.ts). Route-group layouts
 * additionally re-check `profiles.role` on the server.
 */

export const USER_ROLES: readonly UserRole[] = ['customer', 'vendor', 'delivery', 'admin'];

export const ROLE_ROUTES: Record<UserRole, readonly string[]> = {
  customer: ['/dashboard', '/orders', '/subscriptions', '/profile', '/checkout'],
  vendor: [
    '/vendor-dashboard',
    '/menu-management',
    '/vendor-orders',
    '/analytics',
    '/vendor-profile',
    '/payouts',
    '/subscriber-broadcast',
  ],
  delivery: [
    '/delivery-dashboard',
    '/available-orders',
    '/active-deliveries',
    '/operator-profile',
    '/earnings',
  ],
  admin: [
    '/admin',
    '/admin-dashboard',
    '/user-management',
    '/vendor-management',
    '/delivery-management',
    '/support-management',
    '/live-ops',
    '/refunds-ledger',
    '/settlements',
    '/broadcasts',
    '/admin-profile',
  ],
};

/** Pages any signed-in user may open regardless of role. */
export const SHARED_LOGGED_IN_ROUTES: readonly string[] = ['/meals', '/cart'];

export const ROLE_HOME: Record<UserRole, string> = {
  customer: '/dashboard',
  vendor: '/vendor-dashboard',
  delivery: '/delivery-dashboard',
  admin: '/admin-dashboard',
};

function matchesPrefix(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}

export function isProtectedPath(pathname: string): boolean {
  return [...Object.values(ROLE_ROUTES).flat(), ...SHARED_LOGGED_IN_ROUTES].some((route) =>
    matchesPrefix(pathname, route)
  );
}

export function canAccessPath(role: UserRole, pathname: string): boolean {
  return [...ROLE_ROUTES[role], ...SHARED_LOGGED_IN_ROUTES].some((route) =>
    matchesPrefix(pathname, route)
  );
}

/**
 * Reads the role from `app_metadata`, which only the service role can write
 * (kept in sync with `profiles.role` by a database trigger, migration 003).
 * Never reads `user_metadata`: users can change that themselves.
 */
export function roleFromAppMetadata(user: {
  app_metadata?: Record<string, unknown> | null;
}): UserRole | null {
  const role = user.app_metadata?.role;
  return isUserRole(role) ? role : null;
}
