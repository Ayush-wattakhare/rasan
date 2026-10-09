import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database.types';

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

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
        fetch: (url, options = {}) => {
          const timeoutSignal = AbortSignal.timeout(2000);
          const signal = options.signal
            ? AbortSignal.any([options.signal, timeoutSignal])
            : timeoutSignal;
          return fetch(url, {
            ...options,
            signal,
          });
        },
      },
    }
  );

  // Fast-path: Skip auth checks on public pages & static assets
  if (isPublicPage) {
    return supabaseResponse;
  }

  // Protected routes configuration - Require login for meals/menu and cart
  const protectedRoutes = {
    customer: ['/dashboard', '/orders', '/subscriptions', '/profile', '/checkout', '/meals', '/cart'],
    vendor: ['/vendor-dashboard', '/menu-management', '/vendor-orders', '/analytics', '/vendor-profile'],
    delivery: ['/delivery-dashboard', '/available-orders', '/active-deliveries', '/operator-profile', '/earnings'],
    admin: [
      '/admin',
      '/admin-dashboard', 
      '/user-management', 
      '/vendor-management', 
      '/delivery-management', 
      '/support-management', 
      '/live-ops', 
      '/refunds-ledger', 
      '/broadcasts',
      '/admin-profile'
    ],
  };

  const isProtectedRoute = Object.values(protectedRoutes)
    .flat()
    .some((route) => pathname.startsWith(route));

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

  // If user is authenticated, determine role FAST from JWT metadata first
  if (user && isProtectedRoute) {
    let userRole = (user.user_metadata?.role || user.app_metadata?.role) as string | undefined;

    // Only query DB if role is not in JWT metadata (rare fallback)
    if (!userRole) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      userRole = profile?.role;
    }

    if (userRole) {
      const allowedRoutes = protectedRoutes[userRole as keyof typeof protectedRoutes] || [];
      const commonLoggedInRoutes = ['/meals', '/cart'];
      const hasAccess = 
        allowedRoutes.some((route) => pathname.startsWith(route)) ||
        commonLoggedInRoutes.some((route) => pathname.startsWith(route));

      if (!hasAccess) {
        const url = request.nextUrl.clone();
        switch (userRole) {
          case 'customer':
            url.pathname = '/dashboard';
            break;
          case 'vendor':
            url.pathname = '/vendor-dashboard';
            break;
          case 'delivery':
            url.pathname = '/delivery-dashboard';
            break;
          case 'admin':
            url.pathname = '/admin-dashboard';
            break;
          default:
            url.pathname = '/';
        }
        return NextResponse.redirect(url);
      }
    }
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === '/login' || pathname === '/register')) {
    const userRole = user.user_metadata?.role || user.app_metadata?.role || 'customer';
    const url = request.nextUrl.clone();
    
    // If redirectTo is provided and valid, send them back to their requested page
    const redirectTo = request.nextUrl.searchParams.get('redirectTo');
    if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
      url.pathname = redirectTo;
      url.search = '';
      return NextResponse.redirect(url);
    }

    switch (userRole) {
      case 'customer':
        url.pathname = '/dashboard';
        break;
      case 'vendor':
        url.pathname = '/vendor-dashboard';
        break;
      case 'delivery':
        url.pathname = '/delivery-dashboard';
        break;
      case 'admin':
        url.pathname = '/admin-dashboard';
        break;
      default:
        url.pathname = '/';
    }
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
