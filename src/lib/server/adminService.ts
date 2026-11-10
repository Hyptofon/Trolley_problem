import 'server-only';
import { AdminStatsResponse } from '../shared/types';
import { calculateStats } from '../shared/statsCalculator';
import { getServerEnv, ServerConfigurationError } from './env';
import {
  generateSessionToken,
  hashSessionToken,
  verifyAdminPassword,
} from './crypto';
import { getRedisClient } from './redis/client';
import { SESSION_TTL_SECONDS } from './cookies';

export class AdminAuthError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string = 'UNAUTHORIZED', statusCode: number = 401) {
    super(message);
    this.name = 'AdminAuthError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Authenticates admin password, creates a secure session in Redis, and returns session token.
 */
export async function authenticateAdmin(password: string): Promise<string> {
  const env = getServerEnv();

  if (!env.adminPasswordHash) {
    throw new ServerConfigurationError(
      'ADMIN_PASSWORD_HASH не налаштовано на сервері.',
      'ADMIN_NOT_CONFIGURED'
    );
  }

  // Guard against Next.js dotenv-expand truncating unescaped `$salt$key` values to just `16384:8:1`.
  if (/^\d+:\d+:\d+$/.test(env.adminPasswordHash.trim())) {
    throw new ServerConfigurationError(
      'ADMIN_PASSWORD_HASH обрізано через символ "$" у .env. Використовуйте формат через ":" (npm run generate-hash) або екрануйте "$" як "\\$".',
      'ADMIN_HASH_TRUNCATED'
    );
  }

  const isMatch = verifyAdminPassword(password, env.adminPasswordHash);
  if (!isMatch) {
    throw new AdminAuthError('Невірний пароль адміністратора.', 'INVALID_CREDENTIALS', 401);
  }

  const token = generateSessionToken();
  const sessionHash = hashSessionToken(token);
  const sessionKey = `${env.redisKeyPrefix}:admin-session:${sessionHash}`;

  const redis = getRedisClient();
  await redis.set(sessionKey, '1', { ex: SESSION_TTL_SECONDS });

  return token;
}

/**
 * Verifies whether a session token is active and valid in Redis.
 */
export async function verifyAdminSession(token: string | null): Promise<boolean> {
  if (!token || typeof token !== 'string' || token.length < 32) {
    return false;
  }

  try {
    const env = getServerEnv();
    const sessionHash = hashSessionToken(token);
    const sessionKey = `${env.redisKeyPrefix}:admin-session:${sessionHash}`;

    const redis = getRedisClient();
    const exists = await redis.get(sessionKey);
    return !!exists;
  } catch {
    return false;
  }
}

/**
 * Revokes a session token by removing it from Redis.
 */
export async function revokeAdminSession(token: string | null): Promise<void> {
  if (!token) return;

  try {
    const env = getServerEnv();
    const sessionHash = hashSessionToken(token);
    const sessionKey = `${env.redisKeyPrefix}:admin-session:${sessionHash}`;

    const redis = getRedisClient();
    await redis.del(sessionKey);
  } catch {
    // Non-fatal if deletion fails
  }
}

/**
 * Fetches voting aggregates directly from Redis counts hash.
 */
export async function getAdminStats(): Promise<AdminStatsResponse> {
  const env = getServerEnv();
  const redis = getRedisClient();
  const countsKey = `${env.redisKeyPrefix}:counts`;

  try {
    const counts = await redis.hgetall<{
      stay?: string;
      switch?: string;
      updatedAt?: string;
    }>(countsKey);

    return calculateStats({
      stay: counts?.stay,
      switch: counts?.switch,
      updatedAt: counts?.updatedAt,
    });
  } catch (err) {
    if (err instanceof ServerConfigurationError) throw err;
    throw new Error('Не вдалося завантажити статистику зі сховища даних.');
  }
}

