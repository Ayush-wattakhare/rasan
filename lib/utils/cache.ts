/**
 * Simple in-memory cache utility
 * For production, consider using Redis or similar
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class Cache {
  private store: Map<string, CacheEntry<any>> = new Map();

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached data with TTL in seconds
   */
  set<T>(key: string, data: T, ttl: number = 300): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  /**
   * Delete cached data
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get or set cached data
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    const cached = this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }
}

// Singleton instance
export const cache = new Cache();

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now();
  const keys = Array.from(cache['store'].keys());

  keys.forEach((key) => {
    const entry = cache['store'].get(key);
    if (entry && now > entry.expiresAt) {
      cache.delete(key);
    }
  });
}, 60 * 1000);

/**
 * Cache key generators
 */
export const cacheKeys = {
  meal: (id: string) => `meal:${id}`,
  meals: (filters: string) => `meals:${filters}`,
  vendor: (id: string) => `vendor:${id}`,
  vendors: (filters: string) => `vendors:${filters}`,
  order: (id: string) => `order:${id}`,
  orders: (userId: string) => `orders:${userId}`,
  reviews: (mealId: string) => `reviews:${mealId}`,
  analytics: (type: string, dateRange: string) => `analytics:${type}:${dateRange}`,
};
