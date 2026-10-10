# Performance

What the code actually does today, and what to do next. Verified against `next.config.ts`,
`proxy.ts`, `lib/supabase/middleware.ts` and `lib/utils/`.

## In place

### Next.js config (`next.config.ts`)

| Setting | Effect |
|---|---|
| `compress: true` | Gzip responses from the Next server. |
| `poweredByHeader: false` | Drops `X-Powered-By`. |
| `experimental.optimizePackageImports` | Tree-shakes `@/components/ui`, `lucide-react`, `date-fns`, `recharts`. |
| `reactStrictMode: false` | Avoids double renders in dev (dev speed only; hides some bugs). |
| `images.unoptimized: true` | **Image optimization is off.** `next/image` serves originals, so the `formats` (AVIF/WebP), `deviceSizes` and `imageSizes` settings currently have no effect. |

### Request middleware (`proxy.ts` → `lib/supabase/middleware.ts`)

- The matcher skips `/api/*`, `_next/static`, `_next/image`, `favicon.ico` and static file
  extensions, so API routes and assets never pay for a session check.
- Public pages (`/`, `/about`, `/contact`, `/faq`, `/blog`, `/careers`, legal pages) return
  immediately without creating a Supabase client.
- If no `sb-*-auth-token` cookie is present, no network call is made: protected routes redirect
  to `/login`, others pass through.
- Supabase auth calls from middleware time out after 2 s and fail as "unauthenticated".
- Role comes from the JWT's `app_metadata.role`; the `profiles` lookup only runs as a fallback
  and only on protected or auth pages.

### Rendering and data

- `app/meals/[id]` uses ISR (`revalidate = 60`) and `generateStaticParams` to pre-render meal
  pages at build time when Supabase is reachable.
- Dashboards and live views (order detail, delivery, vendor payouts/analytics, admin support)
  are `force-dynamic` so they always show current data.
- Leaflet maps are loaded with `next/dynamic` (`components/orders/order-tracker.tsx`,
  `components/delivery/order-location-preview-modal.tsx`), keeping them out of the initial bundle.
- `next/font/google` (Inter) for self-hosted fonts; a root `app/loading.tsx` plus a few
  `Suspense` boundaries for streaming.
- Database: migration 001 defines ~36 indexes (including PostGIS spatial indexes); 003 adds two.

### Utilities

- `lib/utils/rate-limit.ts` — in-memory, per-instance rate limiter. Used for delivery OTP
  attempts (5 per 15 min). Not shared across serverless instances.
- `lib/utils/cache.ts` (TTL `cache.getOrSet`) and `lib/utils/performance.ts` (`measurePerformance`,
  `debounce`, `throttle`, `RequestBatcher`, `lazyWithRetry`) exist but are **not used** anywhere
  yet. Being in-memory, the cache would also be per-instance on Vercel.

## Recommended next steps

1. Decide on images: remove `images.unoptimized` (Supabase and Unsplash are already in
   `remotePatterns`) or drop the unused `formats`/size settings.
2. Use a shared store (e.g. Redis/Upstash) for rate limiting and caching, or remove the unused
   in-memory cache; wire `rateLimit` into auth, order creation and payment routes.
3. Add `revalidate` or `'use cache'` to other read-mostly pages (`/meals`, `/vendors`, home).
4. Lazy-load Recharts in vendor/admin analytics with `next/dynamic`.
5. Add Vercel Speed Insights or similar to measure real Core Web Vitals before tuning further.
6. Check slow queries in Supabase (Query Performance) once there is real traffic.
