import 'server-only';
import { Redis } from '@upstash/redis';
import { getServerEnv, ServerConfigurationError } from '../env';
import { ATOMIC_VOTE_LUA } from './luaScripts';

export interface IRedisClient {
  get<T = string>(key: string): Promise<T | null>;
  set(
    key: string,
    value: unknown,
    options?: { ex?: number }
  ): Promise<unknown>;
  del(key: string): Promise<number>;
  hgetall<T extends Record<string, unknown>>(key: string): Promise<T | null>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  eval<T>(script: string, keys: string[], args: unknown[]): Promise<T>;
}

export class InMemoryRedisAdapter implements IRedisClient {
  private strings = new Map<string, { value: string; expiresAt?: number }>();
  private hashes = new Map<string, Record<string, string>>();

  private cleanExpired(key: string): void {
    const item = this.strings.get(key);
    if (item && item.expiresAt && Date.now() > item.expiresAt) {
      this.strings.delete(key);
    }
  }

  async get<T = string>(key: string): Promise<T | null> {
    this.cleanExpired(key);
    const item = this.strings.get(key);
    if (!item) return null;
    return item.value as unknown as T;
  }

  async set(
    key: string,
    value: unknown,
    options?: { ex?: number }
  ): Promise<'OK'> {
    const strValue = String(value);
    const expiresAt = options?.ex ? Date.now() + options.ex * 1000 : undefined;
    this.strings.set(key, { value: strValue, expiresAt });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    const deletedStr = this.strings.delete(key) ? 1 : 0;
    const deletedHash = this.hashes.delete(key) ? 1 : 0;
    return deletedStr || deletedHash;
  }

  async hgetall<T extends Record<string, unknown>>(
    key: string
  ): Promise<T | null> {
    const hash = this.hashes.get(key);
    if (!hash) return null;
    return { ...hash } as unknown as T;
  }

  async incr(key: string): Promise<number> {
    this.cleanExpired(key);
    const item = this.strings.get(key);
    const current = item ? parseInt(item.value, 10) || 0 : 0;
    const next = current + 1;
    this.strings.set(key, {
      value: String(next),
      expiresAt: item?.expiresAt,
    });
    return next;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.strings.get(key);
    if (item) {
      item.expiresAt = Date.now() + seconds * 1000;
      return 1;
    }
    return 0;
  }

  async eval<T>(script: string, keys: string[], args: unknown[]): Promise<T> {
    // If the script is our atomic vote script, execute equivalent atomic semantics synchronously
    if (script.includes('HINCRBY') || script === ATOMIC_VOTE_LUA) {
      const [voterKey, countsKey] = keys;
      const [choice, updatedAt] = args as [string, string];

      this.cleanExpired(voterKey);
      const existing = this.strings.get(voterKey);
      if (existing) {
        return ['already_voted', existing.value] as unknown as T;
      }

      this.strings.set(voterKey, { value: choice });

      let currentCounts = this.hashes.get(countsKey);
      if (!currentCounts) {
        currentCounts = { stay: '0', switch: '0', updatedAt };
        this.hashes.set(countsKey, currentCounts);
      }

      const prevChoiceCount = parseInt(currentCounts[choice] || '0', 10);
      currentCounts[choice] = String(prevChoiceCount + 1);
      currentCounts.updatedAt = updatedAt;

      return ['recorded', choice] as unknown as T;
    }

    throw new Error('Unsupported Lua script in InMemoryRedisAdapter');
  }

  clear(): void {
    this.strings.clear();
    this.hashes.clear();
  }
}

// Global in-memory instance for testing / demo
const globalInMemoryAdapter = new InMemoryRedisAdapter();

let cachedClient: IRedisClient | null = null;

export function getRedisClient(): IRedisClient {
  if (cachedClient) {
    return cachedClient;
  }

  const env = getServerEnv();

  // If real Redis credentials are provided, use Upstash Redis SDK
  if (env.redisRestUrl && env.redisRestToken) {
    const upstash = new Redis({
      url: env.redisRestUrl,
      token: env.redisRestToken,
    });

    const client: IRedisClient = {
      get: (k) => upstash.get(k),
      set: (k, v, opts) => {
        if (opts?.ex) {
          return upstash.set(k, v as string | number, { ex: opts.ex });
        }
        return upstash.set(k, v as string | number);
      },
      del: (k) => upstash.del(k),
      hgetall: (k) => upstash.hgetall(k),
      incr: (k) => upstash.incr(k),
      expire: (k, s) => upstash.expire(k, s),
      eval: (s, k, a) => upstash.eval(s, k, a),
    };
    cachedClient = client;
    return cachedClient;
  }

  // If in demo mode in development, permit in-memory adapter
  if (env.isDemoMode) {
    cachedClient = globalInMemoryAdapter;
    return cachedClient;
  }

  // Otherwise fail closed
  throw new ServerConfigurationError(
    'Upstash Redis не налаштовано. Перевірте змінні середовища UPSTASH_REDIS_REST_URL та UPSTASH_REDIS_REST_TOKEN.',
    'REDIS_NOT_CONFIGURED'
  );
}

/**
 * Directly inject or replace the Redis client for automated testing.
 */
export function setTestRedisClient(client: IRedisClient | null): void {
  cachedClient = client;
}

export function getInMemoryRedisAdapter(): InMemoryRedisAdapter {
  return globalInMemoryAdapter;
}
