import { describe, it, expect } from 'vitest';
import {
  createSessionToken,
  verifySessionToken,
  getCookie,
  createSessionCookieHeader,
  createLogoutCookieHeader,
  isValidOrigin,
  verifyPassword,
} from '../../functions/utils/auth';

describe('Auth & Session Security Utilities', () => {
  const SECRET = 'test-secret-key-that-is-sufficiently-long-32-bytes';

  describe('Session Token HMAC', () => {
    it('creates and verifies a valid HMAC-SHA256 session token', async () => {
      const token = await createSessionToken(SECRET, 3600);
      expect(typeof token).toBe('string');
      expect(token.includes('.')).toBe(true);

      const isValid = await verifySessionToken(token, SECRET);
      expect(isValid).toBe(true);
    });

    it('rejects a token signed with a different secret', async () => {
      const token = await createSessionToken(SECRET, 3600);
      const isValid = await verifySessionToken(token, 'different-wrong-secret-key');
      expect(isValid).toBe(false);
    });

    it('rejects an expired session token', async () => {
      // Create token with -10 second TTL (already expired)
      const token = await createSessionToken(SECRET, -10);
      const isValid = await verifySessionToken(token, SECRET);
      expect(isValid).toBe(false);
    });

    it('rejects a tampered token payload', async () => {
      const token = await createSessionToken(SECRET, 3600);
      const [payload, sig] = token.split('.');
      // Tamper base64 payload
      const tamperedPayload = payload.slice(0, -2) + 'AA';
      const isValid = await verifySessionToken(`${tamperedPayload}.${sig}`, SECRET);
      expect(isValid).toBe(false);
    });

    it('rejects an invalid token format', async () => {
      expect(await verifySessionToken('invalid-token', SECRET)).toBe(false);
      expect(await verifySessionToken('a.b.c', SECRET)).toBe(false);
      expect(await verifySessionToken('', SECRET)).toBe(false);
    });
  });

  describe('Cookie handling', () => {
    it('parses target cookie correctly from Request headers', () => {
      const req = new Request('http://localhost/api/test', {
        headers: {
          Cookie: 'other=123; trolley_admin_session=my-session-token; foo=bar',
        },
      });

      const parsed = getCookie(req, 'trolley_admin_session');
      expect(parsed).toBe('my-session-token');
    });

    it('returns null when cookie is absent', () => {
      const req = new Request('http://localhost/api/test');
      expect(getCookie(req, 'trolley_admin_session')).toBeNull();
    });

    it('creates correct session cookie header with HttpOnly and SameSite=Strict', () => {
      const header = createSessionCookieHeader('my-token', true, 3600);
      expect(header).toContain('trolley_admin_session=my-token');
      expect(header).toContain('HttpOnly');
      expect(header).toContain('SameSite=Strict');
      expect(header).toContain('Secure');
      expect(header).toContain('Max-Age=3600');
    });

    it('creates correct logout cookie header with Max-Age=0', () => {
      const header = createLogoutCookieHeader(false);
      expect(header).toContain('Max-Age=0');
      expect(header).toContain('Expires=Thu, 01 Jan 1970');
    });
  });

  describe('Origin check', () => {
    it('accepts requests with matching Origin and URL host', () => {
      const req = new Request('http://localhost:5173/api/vote', {
        headers: { Origin: 'http://localhost:5173' },
      });
      expect(isValidOrigin(req)).toBe(true);
    });

    it('rejects requests with mismatched Origin (foreign site CSRF attempt)', () => {
      const req = new Request('http://localhost:5173/api/vote', {
        headers: { Origin: 'http://evil-attacker.com' },
      });
      expect(isValidOrigin(req)).toBe(false);
    });

    it('accepts same-origin direct requests without Origin header', () => {
      const req = new Request('http://localhost:5173/api/vote');
      expect(isValidOrigin(req)).toBe(true);
    });
  });

  describe('Password verification', () => {
    it('validates matching password correctly', async () => {
      expect(await verifyPassword('super-secret-pass', 'super-secret-pass')).toBe(true);
    });

    it('rejects non-matching password', async () => {
      expect(await verifyPassword('wrong-pass', 'super-secret-pass')).toBe(false);
    });
  });
});

