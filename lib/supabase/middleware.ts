import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database.types';
import type { UserRole } from '@/types';
import {
  ROLE_HOME,
  canAccessPath,
  isProtectedPath,
  isUserRole,
  roleFromAppMetadata,
} from '@/lib/auth/roles';
import { safeRedirectPath } from '@/lib/utils/safe-redirect';
import { devToolsEnabled } from '@/lib/dev-tools';

/**
 * Creates an optimized Supabase client for middleware
 * Uses JWT metadata and cached roles to eliminate slow remote database roundtrips
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;

  // Route alias: /menu -> /meals
  if (pathname === '/menu') {
    const url = request.nextUrl.clone();
    url.pathname = '/meals';
    return NextResponse.redirect(url);
  }

  // Local dev tools (/dev/*, /admin/* tool pages) don't exist unless explicitly enabled.
  // Rewriting here gives a real 404 status (a notFound() in a streamed layout can't).
  const isDevToolPath =
    pathname === '/dev' || pathname.startsWith('/dev/') ||
    pathname === '/admin' || pathname.startsWith('/admin/');
  if (isDevToolPath && !devToolsEnabled()) {
    return NextResponse.rewrite(new URL('/_not-found-dev-tools', request.url));
  }

  // Fast-path: Skip auth checks on public pages & static assets
  const isPublicPage = 
    pathname === '/' || 
    pathname.startsWith('/about') || 
    pathname.startsWith('/contact') || 
    pathname.startsWith('/faq') ||
    pathname.startsWith('/blog') ||
    pathname.startsWith('/careers') ||
    pathname.startsWith('/privacy-policy') ||
    pathname.startsWith('/terms-of-service') ||
    pathname.startsWith('/refund-policy') ||
    pathname.startsWith('/cookie-policy');

  // Immediately exit on public pages without running auth checks
  if (isPublicPage) {
    return supabaseResponse;
  }

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

    const supabase = createServerClient<Database>(
      url,
      anonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value);
            });
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) => {
              supabaseResponse.cookies.set(name, value, options);
            });
          },
        },
        global: {
          fetch: (fetchUrl, options = {}) => {
            const timeoutSignal = AbortSignal.timeout(2000);
            const signal = options.signal
              ? AbortSignal.any([options.signal, timeoutSignal])
              : timeoutSignal;
            return fetch(fetchUrl, {
              ...options,
              signal,
            });
          },
        },
      }
    );

  const isProtectedRoute = isProtectedPath(pathname);

  // Fast cookie check: if user has no Supabase auth token cookie, avoid remote network call
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'));

  if (!hasAuthCookie) {
    if (isProtectedRoute) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // User has auth cookie: verify session with timeout guard
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // If auth server is unreachable or token is corrupt, treat as unauthenticated
  }

  // Redirect to login if accessing protected route with invalid session
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // Resolve role: app_metadata (service-role controlled, synced from profiles by
  // migration 003) first, profiles table as fallback. Never user_metadata, which
  // users can edit themselves.
  let userRole: UserRole | null = null;
  const isAuthPage = pathname === '/login' || pathname === '/register';
  if (user && (isProtectedRoute || isAuthPage)) {
    userRole = roleFromAppMetadata(user);
    if (!userRole) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      userRole = isUserRole(profile?.role) ? profile.role : null;
    }
  }

  if (user && isProtectedRoute && userRole && !canAccessPath(userRole, pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = ROLE_HOME[userRole];
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();

    // If redirectTo is provided and valid, send them back to their requested page
    const redirectTo = request.nextUrl.searchParams.get('redirectTo');
    const safePath = safeRedirectPath(redirectTo, '');
    if (safePath) {
      return NextResponse.redirect(new URL(safePath, request.nextUrl.origin));
    }

    url.pathname = ROLE_HOME[userRole ?? 'customer'];
    url.search = '';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
} catch (error) {
  console.error('Middleware updateSession caught error:', error);
  return supabaseResponse;
}
}
