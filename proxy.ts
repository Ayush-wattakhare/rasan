import { updateSession } from '@/lib/supabase/middleware';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes (they handle their own auth without middleware overhead)
     * - _next/static & _next/image (static files)
     * - favicon.ico & image files
     */
    // Excludes /api and /api/* only (not pages like /apiary), and static asset
    // files by extension (anything with these extensions is served from public/).
    '/((?!api/|api$|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|ico|css|js|map|txt|xml|webmanifest)$).*)',
  ],
};
