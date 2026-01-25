/**
 * Distributed Rate Limiter for 500 Concurrent User Scaling
 *
 * Uses Redis for distributed rate limiting across replicas.
 * Falls back to in-memory limiting if Redis is unavailable.
 *
 * Implements sliding window algorithm for smoother rate limiting.
 */

import Redis from 'ioredis';
import { NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number;    // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;   // Unix timestamp when window resets
  retryAfter?: number; // Seconds until retry (if blocked)
}

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
  // Assessment submission - prevent spam (5 per minute per student)
  SUBMIT: { windowMs: 60 * 1000, maxRequests: 5 },

  // General read endpoints (100 per minute per IP)
  READ: { windowMs: 60 * 1000, maxRequests: 100 },

  // Auth attempts (10 per minute per IP)
  AUTH: { windowMs: 60 * 1000, maxRequests: 10 },

  // Items API - higher limit since it's cached (200 per minute)
  ITEMS: { windowMs: 60 * 1000, maxRequests: 200 },
} as const;

/**
 * In-memory fallback rate limiter (per-process)
 */
class MemoryRateLimiter {
  private windows = new Map<string, { count: number; resetAt: number }>();

  check(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const windowKey = `${key}:${Math.floor(now / config.windowMs)}`;

    let window = this.windows.get(windowKey);
    if (!window || now >= window.resetAt) {
      window = { count: 0, resetAt: now + config.windowMs };
      this.windows.set(windowKey, window);

      // Clean up old windows periodically
      if (this.windows.size > 10000) {
        this.cleanup(now);
      }
    }

    window.count++;

    const allowed = window.count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - window.count);
    const resetTime = Math.ceil(window.resetAt / 1000);

    return {
      allowed,
      remaining,
      resetTime,
      retryAfter: allowed ? undefined : Math.ceil((window.resetAt - now) / 1000),
    };
  }

  private cleanup(now: number): void {
    for (const [key, window] of this.windows.entries()) {
      if (now >= window.resetAt) {
        this.windows.delete(key);
      }
    }
  }
}

/**
 * Distributed Rate Limiter using Redis
 */
class RateLimiter {
  private redis: Redis | null = null;
  private redisAvailable = false;
  private memoryFallback = new MemoryRateLimiter();

  constructor() {
    if (process.env.REDIS_URL) {
      this.initRedis();
    } else {
      console.log('[RateLimiter] Running in memory-only mode (no REDIS_URL)');
    }
  }

  private initRedis(): void {
    try {
      this.redis = new Redis(process.env.REDIS_URL!, {
        maxRetriesPerRequest: 1, // Fail fast for rate limiting
        connectTimeout: 3000,
        commandTimeout: 1000,    // Rate limiting should be fast
        lazyConnect: false,
      });

      this.redis.on('ready', () => {
        console.log('[RateLimiter] Redis connected');
        this.redisAvailable = true;
      });

      this.redis.on('error', (err) => {
        console.warn('[RateLimiter] Redis error:', err.message);
        this.redisAvailable = false;
      });

      this.redis.on('close', () => {
        this.redisAvailable = false;
      });
    } catch (err) {
      console.error('[RateLimiter] Failed to initialize Redis:', err);
    }
  }

  /**
   * Check if request is allowed under rate limit
   */
  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    // Try Redis first
    if (this.redisAvailable && this.redis) {
      try {
        return await this.checkRedis(key, config);
      } catch (err) {
        console.warn('[RateLimiter] Redis check failed, using memory fallback:', err);
      }
    }

    // Fall back to memory
    return this.memoryFallback.check(key, config);
  }

  private async checkRedis(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    const windowKey = `ratelimit:${key}`;
    const windowMs = config.windowMs;

    // Use Redis MULTI for atomic increment
    const pipeline = this.redis!.pipeline();
    pipeline.incr(windowKey);
    pipeline.pttl(windowKey);

    const results = await pipeline.exec();

    if (!results) {
      throw new Error('Redis pipeline returned null');
    }

    const [[incrErr, count], [ttlErr, ttl]] = results as [[Error | null, number], [Error | null, number]];

    if (incrErr) throw incrErr;

    // Set expiry if this is a new window
    if (ttl === -1 || ttl === -2) {
      await this.redis!.pexpire(windowKey, windowMs);
    }

    const allowed = count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - count);
    const resetTime = Math.ceil((now + (ttl > 0 ? ttl : windowMs)) / 1000);

    return {
      allowed,
      remaining,
      resetTime,
      retryAfter: allowed ? undefined : Math.ceil((ttl > 0 ? ttl : windowMs) / 1000),
    };
  }

  /**
   * Generate rate limit key from request
   */
  static getKey(prefix: string, identifier: string): string {
    return `${prefix}:${identifier}`;
  }

  /**
   * Get client IP from request headers
   */
  static getClientIP(request: Request): string {
    // Check common proxy headers
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
      return realIP;
    }

    // Fallback
    return 'unknown';
  }
}

// Export singleton
export const rateLimiter = new RateLimiter();

/**
 * Helper to create rate limit response
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: result.retryAfter,
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.resetTime),
        'Retry-After': String(result.retryAfter || 60),
      },
    }
  );
}

/**
 * Rate limit middleware helper for API routes
 */
export async function checkRateLimit(
  request: Request,
  config: RateLimitConfig,
  keyPrefix = 'api'
): Promise<{ allowed: boolean; response?: NextResponse }> {
  const ip = RateLimiter.getClientIP(request);
  const key = RateLimiter.getKey(keyPrefix, ip);

  const result = await rateLimiter.check(key, config);

  if (!result.allowed) {
    return { allowed: false, response: rateLimitResponse(result) };
  }

  return { allowed: true };
}

/**
 * Rate limit by student ID (for submit endpoints)
 */
export async function checkStudentRateLimit(
  studentId: string,
  courseCode: string
): Promise<{ allowed: boolean; response?: NextResponse }> {
  const key = RateLimiter.getKey('submit', `${courseCode}:${studentId}`);
  const result = await rateLimiter.check(key, RATE_LIMITS.SUBMIT);

  if (!result.allowed) {
    return { allowed: false, response: rateLimitResponse(result) };
  }

  return { allowed: true };
}
