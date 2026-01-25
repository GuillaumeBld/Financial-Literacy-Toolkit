/**
 * Hybrid Cache Utility for 500 Concurrent User Scaling
 *
 * L1 Cache: In-memory (per-process, fast)
 * L2 Cache: Redis (shared across replicas)
 *
 * Falls back gracefully to L1-only if Redis is not available.
 * Items cached during assessment don't change, so even per-replica
 * caching provides significant DB load reduction.
 */

import Redis from 'ioredis';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * In-memory LRU cache with TTL support
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
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
 * Hybrid cache with L1 (memory) and L2 (Redis)
 */
class HybridCache {
  private l1 = new MemoryCache(1000);
  private redisAvailable = false;
  private redisClient: Redis | null = null;
  private redisConnecting = false;

  constructor() {
    if (process.env.REDIS_URL) {
      this.initRedis();
    } else {
      console.log('[Cache] Running in L1-only mode (no REDIS_URL)');
    }
  }

  /**
   * Initialize Redis connection with retry logic
   */
  private initRedis(): void {
    if (this.redisConnecting) return;
    this.redisConnecting = true;

    const redisUrl = process.env.REDIS_URL!;
    console.log('[Cache] Initializing Redis L2 cache...');

    try {
      this.redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            console.warn('[Cache] Redis retry limit reached, falling back to L1-only');
            return null; // Stop retrying
          }
          return Math.min(times * 200, 2000); // Exponential backoff
        },
        lazyConnect: false,
        connectTimeout: 5000,
        commandTimeout: 3000,
        enableReadyCheck: true,
      });

      this.redisClient.on('connect', () => {
        console.log('[Cache] Redis connected');
      });

      this.redisClient.on('ready', () => {
        console.log('[Cache] Redis ready - L2 cache active');
        this.redisAvailable = true;
      });

      this.redisClient.on('error', (err) => {
        console.error('[Cache] Redis error:', err.message);
        this.redisAvailable = false;
      });

      this.redisClient.on('close', () => {
        console.log('[Cache] Redis connection closed');
        this.redisAvailable = false;
      });

      this.redisClient.on('reconnecting', () => {
        console.log('[Cache] Redis reconnecting...');
      });
    } catch (err) {
      console.error('[Cache] Failed to initialize Redis:', err);
      this.redisAvailable = false;
    } finally {
      this.redisConnecting = false;
    }
  }

  /**
   * Get value from cache (L1 first, then L2)
   */
  async get<T>(key: string): Promise<T | null> {
    // Try L1 first (fastest)
    const l1Result = this.l1.get<T>(key);
    if (l1Result !== null) {
      return l1Result;
    }

    // Try L2 (Redis) if available
    if (this.redisAvailable && this.redisClient) {
      try {
        const redisResult = await this.redisClient.get(key);
        if (redisResult) {
          const data = JSON.parse(redisResult) as T;
          // Populate L1 with remaining TTL (estimate 60s)
          this.l1.set(key, data, 60000);
          return data;
        }
      } catch (err) {
        console.warn('[Cache] Redis get error:', err);
        // Continue without Redis
      }
    }

    return null;
  }

  /**
   * Set value in cache (both L1 and L2)
   */
  async set<T>(key: string, data: T, ttlMs: number): Promise<void> {
    // Always set in L1
    this.l1.set(key, data, ttlMs);

    // Set in L2 (Redis) if available
    if (this.redisAvailable && this.redisClient) {
      try {
        const ttlSeconds = Math.ceil(ttlMs / 1000);
        await this.redisClient.setex(key, ttlSeconds, JSON.stringify(data));
      } catch (err) {
        console.warn('[Cache] Redis set error:', err);
        // L1 is still set, so operation partially succeeded
      }
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    this.l1.delete(key);
    if (this.redisAvailable && this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (err) {
        console.warn('[Cache] Redis delete error:', err);
      }
    }
  }

  /**
   * Clear all cache entries (use with caution in production)
   */
  async clear(): Promise<void> {
    this.l1.clear();
    // Note: We don't flush Redis as it might be shared
    // Only clear L1 for this instance
  }

  /**
   * Get or fetch pattern - check cache, if miss fetch and cache
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs: number
  ): Promise<{ data: T; cached: boolean; source: 'l1' | 'l2' | 'db' }> {
    // Try L1 first
    const l1Result = this.l1.get<T>(key);
    if (l1Result !== null) {
      return { data: l1Result, cached: true, source: 'l1' };
    }

    // Try L2 (Redis)
    if (this.redisAvailable && this.redisClient) {
      try {
        const redisResult = await this.redisClient.get(key);
        if (redisResult) {
          const data = JSON.parse(redisResult) as T;
          // Populate L1 for future requests
          this.l1.set(key, data, ttlMs);
          return { data, cached: true, source: 'l2' };
        }
      } catch (err) {
        console.warn('[Cache] Redis getOrFetch error:', err);
      }
    }

    // Cache miss - fetch from source
    const data = await fetchFn();
    await this.set(key, data, ttlMs);
    return { data, cached: false, source: 'db' };
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

  /**
   * Check if Redis is healthy
   */
  async ping(): Promise<boolean> {
    if (!this.redisAvailable || !this.redisClient) {
      return false;
    }
    try {
      const result = await this.redisClient.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.redisClient) {
      console.log('[Cache] Shutting down Redis connection...');
      await this.redisClient.quit();
      this.redisClient = null;
      this.redisAvailable = false;
    }
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

// Graceful shutdown on process termination
process.on('SIGTERM', async () => {
  await cache.shutdown();
});

process.on('SIGINT', async () => {
  await cache.shutdown();
});
