import 'server-only';
import { getRedisClient } from './redis/client';
import { getServerEnv } from './env';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Atomic sliding/fixed window rate limiter using Redis INCR + EXPIRE.
 */
export async function checkRateLimit(
  action: string,
  identifier: string,
  limit: number = 10,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  try {
    const redis = getRedisClient();
    const env = getServerEnv();
    const key = `${env.redisKeyPrefix}:ratelimit:${action}:${identifier}`;

    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }

    const remaining = Math.max(0, limit - count);
    const allowed = count <= limit;

    return {
      allowed,
      limit,
      remaining,
      resetSeconds: windowSeconds,
    };
  } catch {
    // If rate limiter fails (e.g. during redis error), don't block legitimate users unless critical
    return {
      allowed: true,
      limit,
      remaining: 1,
      resetSeconds: windowSeconds,
    };
  }
}
