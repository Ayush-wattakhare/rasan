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

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

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
