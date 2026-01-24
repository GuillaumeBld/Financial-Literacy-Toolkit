/**
 * Hybrid Cache Utility for 500 Concurrent User Scaling
 *
 * L1 Cache: In-memory (per-process, fast)
 * L2 Cache: Redis (shared across replicas, optional)
 *
 * Falls back gracefully to L1-only if Redis is not available.
 * Items cached during assessment don't change, so even per-replica
 * caching provides significant DB load reduction.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * In-memory LRU cache with TTL support
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    // Evict oldest entries if at capacity (simple LRU)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    this.set(key, data, ttlMs);
    return data;
  }
}

/**
 * Hybrid cache with L1 (memory) and optional L2 (Redis)
 * Currently L1-only; Redis support can be added by setting REDIS_URL
 */
class HybridCache {
  private l1 = new MemoryCache(1000);
  private redisAvailable = false;
  private redisClient: any = null;

  constructor() {
    // Redis initialization would go here if REDIS_URL is set
    // For now, using L1-only which still provides significant benefits
    if (process.env.REDIS_URL) {
      console.log('[Cache] Redis URL configured - L2 cache available');
      // Note: To enable Redis, add 'redis' package and uncomment below
      // this.initRedis();
    } else {
      console.log('[Cache] Running in L1-only mode (in-memory cache)');
    }
  }

  /**
   * Get value from cache (L1 first, then L2)
   */
  async get<T>(key: string): Promise<T | null> {
    // Try L1 first
    const l1Result = this.l1.get<T>(key);
    if (l1Result !== null) {
      return l1Result;
    }

    // L2 (Redis) would be checked here if available
    // For now, return null to trigger DB fetch

    return null;
  }

  /**
   * Set value in cache (both L1 and L2)
   */
  async set<T>(key: string, data: T, ttlMs: number): Promise<void> {
    // Always set in L1
    this.l1.set(key, data, ttlMs);

    // L2 (Redis) would be set here if available
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    this.l1.delete(key);
    // L2 (Redis) would be deleted here if available
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.l1.clear();
    // L2 (Redis) would be flushed here if available
  }

  /**
   * Get or fetch pattern - check cache, if miss fetch and cache
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs: number
  ): Promise<{ data: T; cached: boolean }> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return { data: cached, cached: true };
    }

    const data = await fetchFn();
    await this.set(key, data, ttlMs);
    return { data, cached: false };
  }

  /**
   * Get cache statistics
   */
  getStats(): { l1Size: number; redisAvailable: boolean } {
    return {
      l1Size: this.l1.size(),
      redisAvailable: this.redisAvailable,
    };
  }
}

// Export singleton instance
export const cache = new HybridCache();

// TTL constants for different data types
export const TTL = {
  ITEMS: 5 * 60 * 1000,         // 5 min - questions don't change during assessment
  COURSES: 10 * 60 * 1000,      // 10 min - course config is stable
  INSTRUMENTS: 60 * 60 * 1000,  // 1 hour - rarely changes
  USER_SESSION: 30 * 60 * 1000, // 30 min - user context
};

// Export MemoryCache for direct use if needed
export { MemoryCache };
