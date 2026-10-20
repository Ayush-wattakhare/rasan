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

// In-memory store: per server instance. On serverless (Vercel) each instance
// counts separately, so security-sensitive limits use rateLimitShared() below,
// which uses Upstash Redis when UPSTASH_REDIS_REST_URL / _TOKEN are set.
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

let warnedNoRedis = false;

/**
 * Rate limit shared by all server instances (fixed window in Upstash Redis via
 * its REST API, no extra dependency). Falls back to the in-memory limiter when
 * Upstash isn't configured or is unreachable, so it never blocks traffic on
 * an outage.
 */
export async function rateLimitShared(
  identifier: string,
  options: RateLimitOptions = { interval: 60000, maxRequests: 100 }
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (!warnedNoRedis && process.env.NODE_ENV === 'production') {
      warnedNoRedis = true;
      console.warn('[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set: limits are per server instance');
    }
    return rateLimit(identifier, options);
  }

  const windowStart = Math.floor(Date.now() / options.interval) * options.interval;
  const key = `rl:${identifier}:${windowStart}`;
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['INCR', key],
        ['PEXPIRE', key, String(options.interval)],
      ]),
      signal: AbortSignal.timeout(1500),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`Upstash ${res.status}`);
    const data = (await res.json()) as Array<{ result?: number }>;
    const count = Number(data?.[0]?.result) || 0;
    return {
      success: count <= options.maxRequests,
      limit: options.maxRequests,
      remaining: Math.max(0, options.maxRequests - count),
      reset: windowStart + options.interval,
    };
  } catch (err) {
    console.warn('[rate-limit] shared store unavailable, using in-memory:', (err as Error).message);
    return rateLimit(identifier, options);
  }
}
