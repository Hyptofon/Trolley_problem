export interface SessionPayload {
  iat: number;
  exp: number;
}

const SESSION_COOKIE_NAME = 'trolley_admin_session';
const SESSION_TTL_SECONDS = 4 * 60 * 60; // 4 hours

/**
 * Base64URL encode buffer/string.
 */
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Base64URL decode string.
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

/**
 * Derives an HMAC-SHA256 CryptoKey from a secret string.
 */
async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Creates a signed session token.
 */
export async function createSessionToken(
  secret: string,
  ttlSeconds: number = SESSION_TTL_SECONDS
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    iat: now,
    exp: now + ttlSeconds,
  };

  const payloadString = JSON.stringify(payload);
  const encodedPayload = base64UrlEncode(payloadString);

  const key = await getCryptoKey(secret);
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(encodedPayload)
  );

  const signatureBytes = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => String.fromCharCode(b))
    .join('');
  const encodedSignature = base64UrlEncode(signatureBytes);

  return `${encodedPayload}.${encodedSignature}`;
}

/**
 * Verifies the validity and expiration of a session token.
 */
export async function verifySessionToken(
  token: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [encodedPayload, encodedSignature] = parts;
    const rawSignature = base64UrlDecode(encodedSignature);
    const signatureBytes = new Uint8Array(
      rawSignature.split('').map((c) => c.charCodeAt(0))
    );

    const key = await getCryptoKey(secret);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      new TextEncoder().encode(encodedPayload)
    );

    if (!isValid) return false;

    const payloadJson = base64UrlDecode(encodedPayload);
    const payload: SessionPayload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Parses cookies from Request header.
 */
export function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [k, ...v] = cookie.trim().split('=');
    if (k === name) {
      return decodeURIComponent(v.join('='));
    }
  }
  return null;
}

/**
 * Extracts and verifies the admin session from request cookies.
 */
export async function isAuthenticatedAdmin(
  request: Request,
  secret: string
): Promise<boolean> {
  const token = getCookie(request, SESSION_COOKIE_NAME);
  if (!token) return false;
  return verifySessionToken(token, secret);
}

/**
 * Generates Set-Cookie header for session creation.
 */
export function createSessionCookieHeader(
  token: string,
  isSecure: boolean,
  ttlSeconds: number = SESSION_TTL_SECONDS
): string {
  const secureFlag = isSecure ? '; Secure' : '';
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(
    token
  )}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${ttlSeconds}${secureFlag}`;
}

/**
 * Generates Set-Cookie header for session removal.
 */
export function createLogoutCookieHeader(isSecure: boolean): string {
  const secureFlag = isSecure ? '; Secure' : '';
  return `${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secureFlag}`;
}

/**
 * Validates request Origin / Sec-Fetch-Site for state-changing endpoints.
 */
export function isValidOrigin(request: Request): boolean {
  const origin = request.headers.get('Origin');
  if (!origin) {
    // Non-browser or same-origin direct request without Origin header
    return true;
  }

  const url = new URL(request.url);
  try {
    const originUrl = new URL(origin);
    return originUrl.host === url.host;
  } catch {
    return false;
  }
}

/**
 * Constant-time safe password verification.
 */
export async function verifyPassword(
  provided: string,
  expected: string
): Promise<boolean> {
  if (typeof provided !== 'string' || typeof expected !== 'string') {
    return false;
  }

  const enc = new TextEncoder();
  const hashProvided = await crypto.subtle.digest('SHA-256', enc.encode(provided));
  const hashExpected = await crypto.subtle.digest('SHA-256', enc.encode(expected));

  const pBytes = new Uint8Array(hashProvided);
  const eBytes = new Uint8Array(hashExpected);

  if (pBytes.length !== eBytes.length) return false;

  let diff = 0;
  for (let i = 0; i < pBytes.length; i++) {
    diff |= pBytes[i] ^ eBytes[i];
  }
  return diff === 0;
}

