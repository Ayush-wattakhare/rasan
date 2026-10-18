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

const PUBLIC_PREFIXES = [
  '/about',
  '/contact',
  '/faq',
  '/blog',
  '/careers',
  '/privacy-policy',
  '/terms-of-service',
  '/refund-policy',
  '/cookie-policy',
];

function isPublicPage(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/meals' ||
    pathname.startsWith('/meals/') ||
    pathname === '/cart' ||
    pathname === '/vendors' ||
    pathname.startsWith('/vendors/') ||
    PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  );
}

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'));
}

/**
 * Refreshes the Supabase session and enforces role-based page access.
 *
 * Every redirect copies the cookies Supabase set during this request (token
 * refresh rotates the refresh token); dropping them logged users out at random.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  /** Redirect that keeps any refreshed auth cookies. */
  const redirectWithCookies = (url: URL) => {
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    return response;
  };

  const redirectToLogin = () => {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('redirectTo', pathname);
    return redirectWithCookies(url);
  };

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

  const hasAuthCookie = hasSupabaseAuthCookie(request);
  const isPublic = isPublicPage(pathname);

  // Anonymous visitor on a public page: nothing to refresh or check.
  if (isPublic && !hasAuthCookie) {
    return supabaseResponse;
  }

  const isProtectedRoute = isProtectedPath(pathname);

  // No session cookie at all: avoid a network round trip.
  if (!hasAuthCookie) {
    return isProtectedRoute ? redirectToLogin() : supabaseResponse;
  }

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

    const supabase = createServerClient<Database>(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
      global: {
        fetch: (fetchUrl, options = {}) => {
          const timeoutSignal = AbortSignal.timeout(2000);
          const signal = options.signal
            ? AbortSignal.any([options.signal, timeoutSignal])
            : timeoutSignal;
          return fetch(fetchUrl, { ...options, signal });
        },
      },
    });

    // Verify (and refresh) the session. Runs on public pages too, so signed-in
    // users browsing /meals keep a fresh token.
    let user = null;
    try {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch {
      // Auth server unreachable or token corrupt: treat as signed out.
    }

    if (isPublic) return supabaseResponse;

    if (isProtectedRoute && !user) return redirectToLogin();

    // Role: app_metadata (service-role controlled, synced from profiles by
    // migration 003) first, profiles table as fallback. Never user_metadata.
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

    if (user && isProtectedRoute) {
      // No resolvable role (e.g. profile row not created yet): least privilege.
      // Treated as a customer, whose layout self-heals the missing profile; this
      // never grants vendor/rider/admin pages (it used to skip the check entirely).
      const effectiveRole: UserRole = userRole ?? 'customer';
      if (!canAccessPath(effectiveRole, pathname)) {
        const target = request.nextUrl.clone();
        target.pathname = ROLE_HOME[effectiveRole];
        target.search = '';
        return redirectWithCookies(target);
      }
    }

    // Signed-in users don't need the login/register pages.
    if (user && isAuthPage) {
      const safePath = safeRedirectPath(request.nextUrl.searchParams.get('redirectTo'), '');
      if (safePath) {
        return redirectWithCookies(new URL(safePath, request.nextUrl.origin));
      }
      const target = request.nextUrl.clone();
      target.pathname = ROLE_HOME[userRole ?? 'customer'];
      target.search = '';
      return redirectWithCookies(target);
    }

    return supabaseResponse;
  } catch (error) {
    console.error('Middleware updateSession caught error:', error);
    // Fail closed for protected pages; everything else passes through.
    return isProtectedRoute ? redirectToLogin() : supabaseResponse;
  }
}
