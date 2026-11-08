import 'server-only';
import crypto from 'node:crypto';

/**
 * Creates a deterministic HMAC-SHA256 digest of participant UUID.
 * The raw UUID is never stored in Redis and never logged.
 */
export function getParticipantDigest(uuid: string, secret: string): string {
  if (!secret) {
    throw new Error('VOTE_ID_HMAC_SECRET не налаштовано на сервері');
  }
  return crypto.createHmac('sha256', secret).update(uuid).digest('hex');
}

const SCRYPT_PARAMS = {
  N: 16384,
  r: 8,
  p: 1,
  keyLen: 64,
};

/**
 * Creates a salted scrypt hash of a password for ADMIN_PASSWORD_HASH.
 */
export function hashAdminPassword(password: string): string {
  if (typeof password !== 'string' || password.length < 8) {
    throw new Error('Пароль має містити щонайменше 8 символів.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto
    .scryptSync(password.normalize('NFKC'), salt, SCRYPT_PARAMS.keyLen, {
      N: SCRYPT_PARAMS.N,
      r: SCRYPT_PARAMS.r,
      p: SCRYPT_PARAMS.p,
    })
    .toString('hex');

  return `${SCRYPT_PARAMS.N}:${SCRYPT_PARAMS.r}:${SCRYPT_PARAMS.p}$${salt}$${derivedKey}`;
}

/**
 * Verifies password against stored salted scrypt hash.
 * Uses crypto.timingSafeEqual to prevent timing attacks.
 */
export function verifyAdminPassword(
  providedPassword: string,
  storedHash: string
): boolean {
  if (
    typeof providedPassword !== 'string' ||
    typeof storedHash !== 'string' ||
    !storedHash
  ) {
    return false;
  }

  const parts = storedHash.split('$');
  if (parts.length !== 3) {
    return false;
  }

  const [paramsStr, salt, expectedKeyHex] = parts;
  const [N, r, p] = paramsStr.split(':').map(Number);

  if (!N || !r || !p || !salt || !expectedKeyHex) {
    return false;
  }

  try {
    const expectedBuffer = Buffer.from(expectedKeyHex, 'hex');
    const derivedKey = crypto.scryptSync(
      providedPassword.normalize('NFKC'),
      salt,
      expectedBuffer.length,
      { N, r, p }
    );

    if (derivedKey.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(derivedKey, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Generates a high-entropy cryptographically random session token (32 bytes).
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Derives a SHA-256 digest of a session token for Redis storage.
 * If the Redis DB is ever exposed, raw session tokens cannot be read directly.
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
