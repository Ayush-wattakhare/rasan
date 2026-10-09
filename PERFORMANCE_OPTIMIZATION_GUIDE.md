# Performance Optimization Guide - Rasan Platform

## Overview
This document outlines all performance optimizations implemented in the Rasan platform to ensure fast load times, smooth interactions, and efficient resource usage.

---

## ✅ Implemented Optimizations

### 1. Next.js Image Optimization
**Status:** ✅ Complete

**Configuration** (`next.config.ts`):
- Modern image formats (AVIF, WebP) enabled
- Remote patterns configured for Supabase Storage and external images
- Responsive image sizes: 640px to 3840px
- Lazy loading by default

**Usage:**
```tsx
import Image from 'next/image';

<Image
  src="/meal-image.jpg"
  alt="Meal"
  width={400}
  height={300}
  priority={false} // Lazy load by default
/>
```

### 2. Server-Side Rendering (SSR) & ISR
**Status:** ✅ Complete

**Implemented Pages:**
- `/meals` - ISR with 60s revalidation
- `/meals/[id]` - ISR with 60s revalidation
- `/vendors` - ISR with 60s revalidation
- `/vendors/[id]` - ISR with 60s revalidation
- Home page - ISR with 60s revalidation

**Benefits:**
- Faster initial page loads
- Better SEO
- Reduced client-side data fetching

### 3. Code Splitting & Dynamic Imports
**Status:** ⚠️ Partial - Needs Enhancement

**Current Implementation:**
- Next.js automatic code splitting for pages
- Route-based code splitting

**Recommended Additions:**
```tsx
// Heavy components should use dynamic imports
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/vendors/map-view'), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false, // Disable SSR for map components
});

const Chart = dynamic(() => import('@/components/analytics/revenue-chart'), {
  loading: () => <Skeleton className="h-64 w-full" />,
});
```

### 4. React Performance Optimizations
**Status:** ⚠️ Needs Implementation

**Recommended:**
```tsx
// Use React.memo for expensive components
import { memo } from 'react';

export const MealCard = memo(({ meal }) => {
  // Component logic
});

// Use useMemo for expensive calculations
const sortedMeals = useMemo(() => {
  return meals.sort((a, b) => b.rating - a.rating);
}, [meals]);

// Use useCallback for event handlers
const handleAddToCart = useCallback((mealId) => {
  addToCart(mealId);
}, [addToCart]);
```

### 5. Database Query Optimization
**Status:** ✅ Complete

**Implemented:**
- Indexes on frequently queried columns
- Spatial indexes (GIST) for location-based queries
- RLS policies for security without performance impact
- Selective field fetching (only fetch needed columns)

**Example:**
```typescript
// Good: Select only needed fields
const { data } = await supabase
  .from('meals')
  .select('id, name, price, image_url, rating')
  .eq('is_available', true);

// Avoid: Select all fields
// .select('*')
```

### 6. Caching Strategy
**Status:** ⚠️ Partial - Needs Enhancement

**Current:**
- Next.js automatic caching for static assets
- ISR caching for pages (60s revalidation)
- Browser caching via headers

**Recommended Additions:**
```typescript
// Client-side caching with SWR
import useSWR from 'swr';

function useMeals() {
  const { data, error } = useSWR('/api/meals', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 60000, // 1 minute
  });
  
  return { meals: data, isLoading: !error && !data, error };
}
```

### 7. Loading States & Skeletons
**Status:** ✅ Complete

**Implemented:**
- Global loading.tsx
- Skeleton components for all data-fetching pages
- Shimmer effect for better UX
- Suspense boundaries

### 8. Bundle Size Optimization
**Status:** ✅ Complete

**Configuration:**
- SWC minification enabled
- Tree shaking enabled
- Package import optimization for `@/components/ui` and `lucide-react`
- Compression enabled

### 9. API Route Optimization
**Status:** ✅ Complete

**Implemented:**
- Efficient database queries
- Error handling without performance overhead
- Response compression
- Proper HTTP status codes

### 10. Real-time Optimization
**Status:** ✅ Complete

**Supabase Realtime:**
- Selective subscriptions (only subscribe to needed data)
- Automatic cleanup on unmount
- Efficient state updates

---

## 🔄 Recommended Enhancements

### Priority 1: Dynamic Imports for Heavy Components

**Components to optimize:**
1. Map components (Leaflet)
2. Chart components (Recharts)
3. Rich text editors
4. Image galleries

**Implementation:**
```tsx
// components/vendors/map-view-lazy.tsx
import dynamic from 'next/dynamic';

export const MapViewLazy = dynamic(
  () => import('./map-view'),
  {
    loading: () => <div className="h-96 w-full bg-muted animate-pulse rounded-lg" />,
    ssr: false,
  }
);
```

### Priority 2: Implement SWR for Client-Side Data Fetching

**Install:**
```bash
npm install swr
```

**Usage:**
```tsx
// lib/hooks/use-swr-meals.ts
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useMeals(filters?: MealFilters) {
  const queryString = new URLSearchParams(filters).toString();
  const { data, error, mutate } = useSWR(
    `/api/meals?${queryString}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    meals: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
```

### Priority 3: Add React.memo to Expensive Components

**Target components:**
- MealCard
- VendorCard
- OrderCard
- ReviewCard
- Chart components

**Example:**
```tsx
import { memo } from 'react';

export const MealCard = memo(({ meal, onAddToCart }: MealCardProps) => {
  return (
    // Component JSX
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  return prevProps.meal.id === nextProps.meal.id &&
         prevProps.meal.price === nextProps.meal.price;
});

MealCard.displayName = 'MealCard';
```

### Priority 4: Implement Rate Limiting

**Create middleware:**
```typescript
// lib/rate-limit.ts
import { LRUCache } from 'lru-cache';

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

export default function rateLimit(options?: Options) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;

        return isRateLimited ? reject() : resolve();
      }),
  };
}

// Usage in API routes
const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500,
});

export async function POST(request: Request) {
  try {
    await limiter.check(10, 'CACHE_TOKEN'); // 10 requests per minute
    // Handle request
  } catch {
    return new Response('Rate limit exceeded', { status: 429 });
  }
}
```

### Priority 5: Database Connection Pooling

**Supabase Configuration:**
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';

export async function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: {
        schema: 'public',
      },
      auth: {
        persistSession: true,
      },
      global: {
        headers: {
          'x-connection-pool': 'true',
        },
      },
    }
  );
}
```

---

## 📊 Performance Metrics

### Target Metrics:
- **First Contentful Paint (FCP):** < 1.8s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Time to Interactive (TTI):** < 3.8s
- **Cumulative Layout Shift (CLS):** < 0.1
- **First Input Delay (FID):** < 100ms

### Monitoring Tools:
1. **Lighthouse** - Built into Chrome DevTools
2. **Web Vitals** - Install `web-vitals` package
3. **Vercel Analytics** - Automatic when deployed to Vercel

**Install Web Vitals:**
```bash
npm install web-vitals
```

**Usage:**
```tsx
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }: { children: React.Node }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

---

## 🎯 Performance Checklist

### Images
- [x] Next.js Image component used throughout
- [x] Modern formats (AVIF, WebP) enabled
- [x] Lazy loading enabled
- [x] Responsive sizes configured
- [ ] Image CDN configured (optional)

### Code Splitting
- [x] Automatic route-based splitting
- [ ] Dynamic imports for heavy components
- [ ] Lazy loading for below-the-fold content

### Caching
- [x] ISR enabled for static pages
- [x] Browser caching headers
- [ ] SWR for client-side caching
- [ ] Service worker (optional)

### Database
- [x] Indexes on frequently queried columns
- [x] Spatial indexes for location queries
- [x] Selective field fetching
- [x] RLS policies optimized

### React Optimization
- [ ] React.memo for expensive components
- [ ] useMemo for expensive calculations
- [ ] useCallback for event handlers
- [ ] Virtualization for long lists (optional)

### API Routes
- [x] Efficient queries
- [x] Error handling
- [ ] Rate limiting
- [x] Response compression

### Monitoring
- [ ] Web Vitals tracking
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] User analytics

---

## 🚀 Quick Wins

### 1. Add Loading Priority to Hero Images
```tsx
<Image
  src="/hero.jpg"
  alt="Hero"
  priority={true} // Load immediately
  width={1920}
  height={1080}
/>
```

### 2. Preload Critical Resources
```tsx
// app/layout.tsx
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="dns-prefetch" href="https://api.supabase.co" />
</head>
```

### 3. Optimize Font Loading
```tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Use fallback font while loading
  variable: '--font-inter',
});
```

### 4. Reduce JavaScript Bundle
- Remove unused dependencies
- Use tree-shakeable imports
- Analyze bundle with `@next/bundle-analyzer`

---

## 📝 Testing Performance

### Local Testing:
```bash
# Build for production
npm run build

# Start production server
npm start

# Run Lighthouse audit
# Open Chrome DevTools > Lighthouse > Generate Report
```

### Bundle Analysis:
```bash
# Install analyzer
npm install @next/bundle-analyzer

# Add to next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);

# Run analysis
ANALYZE=true npm run build
```

---

## 🎓 Best Practices

1. **Always use Next.js Image component** for images
2. **Implement loading states** for all async operations
3. **Use ISR** for pages that don't change frequently
4. **Optimize database queries** - fetch only what you need
5. **Lazy load** heavy components below the fold
6. **Monitor performance** regularly with Lighthouse
7. **Test on slow networks** (Chrome DevTools > Network > Slow 3G)
8. **Optimize for mobile first** - most users are on mobile

---

## 📚 Resources

- [Next.js Performance Docs](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Supabase Performance](https://supabase.com/docs/guides/database/performance)

---

**Last Updated:** Phase 4 Implementation
**Status:** Most optimizations complete, enhancements recommended
