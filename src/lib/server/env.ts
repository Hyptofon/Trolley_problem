import 'server-only';

export class ServerConfigurationError extends Error {
  code: string;

  constructor(message: string, code: string = 'CONFIGURATION_ERROR') {
    super(message);
    this.name = 'ServerConfigurationError';
    this.code = code;
  }
}

export interface ServerEnvConfig {
  redisRestUrl?: string;
  redisRestToken?: string;
  adminPasswordHash: string;
  voteIdHmacSecret: string;
  redisKeyPrefix: string;
  isDemoMode: boolean;
  isProduction: boolean;
}

export function getServerEnv(): ServerEnvConfig {
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production';

  const redisRestUrl =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL || // compatibility with some Vercel Marketplace integrations
    '';
  const redisRestToken =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    '';

  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || '';
  const voteIdHmacSecret =
    process.env.VOTE_ID_HMAC_SECRET ||
    (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
      ? 'dev-vote-id-hmac-secret-at-least-32-chars-long'
      : '');
  const redisKeyPrefix =
    process.env.REDIS_KEY_PREFIX ||
    (isProduction ? 'trolley:production:v1' : 'trolley:development:v1');

  // DEMO_MODE is ONLY permitted in development and test environments
  const isDemoMode =
    !isProduction &&
    (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') &&
    process.env.DEMO_MODE === 'true';

  // In production or preview on Vercel without DEMO_MODE, fail closed if Redis is missing
  if (isProduction && (!redisRestUrl || !redisRestToken)) {
    throw new ServerConfigurationError(
      'Зовнішнє сховище Upstash Redis не налаштовано. Перевірте змінні UPSTASH_REDIS_REST_URL та UPSTASH_REDIS_REST_TOKEN у Vercel.',
      'REDIS_NOT_CONFIGURED'
    );
  }

  return {
    redisRestUrl,
    redisRestToken,
    adminPasswordHash,
    voteIdHmacSecret,
    redisKeyPrefix,
    isDemoMode,
    isProduction,
  };
}
