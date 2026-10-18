/**
 * Rate limiting utility using in-memory store
 * For production, consider using Redis or similar
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// TODO: Replace with Redis-backed store (e.g. Upstash) before scaling.
// On serverless (Vercel), this store is instance-scoped, so the window
// is not globally enforced across concurrent cold-start instances.
const store: RateLimitStore = {};
const MAX_KEYS = 10_000;
let keyCount = 0;

function sweepExpired(now: number) {
  for (const key of Object.keys(store)) {
    if (store[key].resetTime < now) {
      delete store[key];
      keyCount--;
    }
  }
}

// Clean up old entries every 5 minutes. unref() so the timer never keeps a
// serverless worker or test process alive.
const sweepTimer = setInterval(() => sweepExpired(Date.now()), 5 * 60 * 1000);
(sweepTimer as { unref?: () => void }).unref?.();

export interface RateLimitOptions {
  interval: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per interval
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Rate limit a request based on identifier (e.g., IP address or user ID)
 */
export function rateLimit(
  identifier: string,
  options: RateLimitOptions = { interval: 60000, maxRequests: 100 }
): RateLimitResult {
  const now = Date.now();
  const key = `${identifier}`;

  if (!store[key] || store[key].resetTime < now) {
    if (!store[key]) {
      // Keys can be attacker-influenced (ids in URLs): keep the store bounded.
      if (keyCount >= MAX_KEYS) sweepExpired(now);
      keyCount++;
    }
    store[key] = {
      count: 1,
      resetTime: now + options.interval,
    };

    return {
      success: true,
      limit: options.maxRequests,
      remaining: options.maxRequests - 1,
      reset: store[key].resetTime,
    };
  }

  store[key].count++;

  const success = store[key].count <= options.maxRequests;

  return {
    success,
    limit: options.maxRequests,
    remaining: Math.max(0, options.maxRequests - store[key].count),
    reset: store[key].resetTime,
  };
}

/**
 * Get rate limit headers for HTTP response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  };
}
