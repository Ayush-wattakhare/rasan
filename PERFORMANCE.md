# Performance Optimization Guide

This document outlines the performance optimizations implemented in the Rasan platform.

## Image Optimization

### Next.js Image Component
- All images use Next.js `Image` component for automatic optimization
- Configured formats: AVIF and WebP for modern browsers
- Lazy loading enabled by default
- Responsive image sizes configured for different viewports

### Configuration
```typescript
// next.config.ts
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
}
```

## Caching Strategy

### In-Memory Cache
- Implemented in `lib/utils/cache.ts`
- TTL-based expiration
- Automatic cleanup of expired entries
- Cache key generators for consistent naming

### Usage Example
```typescript
import { cache, cacheKeys } from '@/lib/utils/cache';

const meals = await cache.getOrSet(
  cacheKeys.meals('filters'),
  async () => fetchMeals(),
  300 // 5 minutes TTL
);
```

### ISR (Incremental Static Regeneration)
- Meal detail pages revalidate every 60 seconds
- Top 20 meals pre-generated at build time
- Automatic background regeneration

## Rate Limiting

### Implementation
- In-memory rate limiting in `lib/utils/rate-limit.ts`
- Default: 100 requests per minute per user
- Automatic cleanup of expired entries
- Rate limit headers in responses

### Usage Example
```typescript
import { rateLimit, getRateLimitHeaders } from '@/lib/utils/rate-limit';

const result = rateLimit(userId, {
  interval: 60000, // 1 minute
  maxRequests: 100
});

if (!result.success) {
  return new Response('Too many requests', {
    status: 429,
    headers: getRateLimitHeaders(result)
  });
}
```

## Component Optimization

### React.memo
- Heavy components wrapped with `React.memo`
- Prevents unnecessary re-renders
- Examples: MealCard, OrderCard, VendorCard

### Dynamic Imports
- Heavy components loaded on-demand
- Reduces initial bundle size
- Retry logic for failed imports

### Example
```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(
  () => import('@/components/heavy-component'),
  { loading: () => <Skeleton /> }
);
```

## Database Optimization

### Indexes
- Spatial indexes (GIST) on location columns
- B-tree indexes on frequently queried columns
- Composite indexes for common query patterns

### Query Optimization
- Select only required columns
- Use pagination for large result sets
- Leverage Supabase connection pooling

### Example
```typescript
// Good: Select specific columns
const { data } = await supabase
  .from('meals')
  .select('id, name, price, image_url')
  .limit(20);

// Bad: Select all columns
const { data } = await supabase
  .from('meals')
  .select('*');
```

## Bundle Optimization

### Package Import Optimization
```typescript
// next.config.ts
experimental: {
  optimizePackageImports: ['@/components/ui', 'lucide-react'],
}
```

### Code Splitting
- Automatic code splitting by Next.js
- Route-based splitting
- Component-level splitting with dynamic imports

## Performance Utilities

### Debounce & Throttle
```typescript
import { debounce, throttle } from '@/lib/utils/performance';

// Debounce search input
const debouncedSearch = debounce(handleSearch, 300);

// Throttle scroll events
const throttledScroll = throttle(handleScroll, 100);
```

### Performance Measurement
```typescript
import { measurePerformance } from '@/lib/utils/performance';

const result = await measurePerformance('fetchMeals', async () => {
  return await fetchMeals();
});
```

## Best Practices

### 1. Server Components by Default
- Use Server Components for data fetching
- Only use Client Components when needed (interactivity, hooks)

### 2. Streaming and Suspense
- Use loading.tsx for route-level loading states
- Implement Suspense boundaries for component-level loading

### 3. Minimize Client-Side JavaScript
- Move logic to server when possible
- Use Server Actions for mutations
- Reduce client bundle size

### 4. Optimize Fonts
- Use Next.js font optimization
- Preload critical fonts
- Use font-display: swap

### 5. Minimize Layout Shifts
- Reserve space for images with aspect ratios
- Use skeleton loaders
- Avoid dynamic content above the fold

## Monitoring

### Development
- Performance logs in development mode
- React DevTools Profiler
- Next.js build analyzer

### Production
- Consider implementing:
  - Sentry for error tracking
  - Vercel Analytics for performance metrics
  - Custom performance monitoring

## Performance Targets

- **Time to First Byte (TTFB)**: < 200ms
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Cumulative Layout Shift (CLS)**: < 0.1

## Future Optimizations

1. **Redis Cache**: Replace in-memory cache with Redis for distributed caching
2. **CDN**: Use CDN for static assets and images
3. **Service Workers**: Implement offline support and background sync
4. **Database Read Replicas**: Distribute read queries across replicas
5. **GraphQL**: Consider GraphQL for more efficient data fetching
6. **Edge Functions**: Move more logic to edge for lower latency
