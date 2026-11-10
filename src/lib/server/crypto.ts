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
 * Parses either "$" delimited (`N:r:p$salt$key`) or dotenv-safe ":" delimited (`N:r:p:salt:key`) scrypt hashes.
 */
function parseScryptHash(storedHash: string): {
  N: number;
  r: number;
  p: number;
  salt: string;
  expectedKeyHex: string;
} | null {
  let N: number;
  let r: number;
  let p: number;
  let salt: string;
  let expectedKeyHex: string;

  const dollarParts = storedHash.split('$');
  const colonParts = storedHash.split(':');

  if (dollarParts.length === 3) {
    const [paramsStr, s, key] = dollarParts;
    [N, r, p] = paramsStr.split(':').map(Number);
    salt = s;
    expectedKeyHex = key;
  } else if (colonParts.length === 5) {
    [N, r, p] = colonParts.slice(0, 3).map(Number);
    salt = colonParts[3];
    expectedKeyHex = colonParts[4];
  } else {
    return null;
  }

  if (!N || !r || !p || !salt || !expectedKeyHex) {
    return null;
  }

  return { N, r, p, salt, expectedKeyHex };
}

/**
 * Verifies password against stored salted scrypt hash.
 * Supports both `$`-delimited hashes and dotenv-safe `:`-delimited hashes.
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

  const parsed = parseScryptHash(storedHash.trim());
  if (!parsed) {
    return false;
  }

  try {
    const expectedBuffer = Buffer.from(parsed.expectedKeyHex, 'hex');
    if (expectedBuffer.length === 0) {
      return false;
    }

    const derivedKey = crypto.scryptSync(
      providedPassword.normalize('NFKC'),
      parsed.salt,
      expectedBuffer.length,
      { N: parsed.N, r: parsed.r, p: parsed.p }
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
