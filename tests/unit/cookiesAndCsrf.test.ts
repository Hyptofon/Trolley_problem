import { describe, it, expect } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  getSessionTokenFromRequest,
  setAdminSessionCookie,
  clearAdminSessionCookie,
} from '@/lib/server/cookies';
import { isValidOrigin } from '@/lib/server/csrf';

describe('Cookies and CSRF Server Utilities', () => {
  describe('Cookies handling', () => {
    it('extracts session token from NextRequest cookies', () => {
      const req = new NextRequest('http://localhost:3000/api/admin/stats', {
        headers: {
          cookie: `${ADMIN_SESSION_COOKIE}=mock-session-token-123`,
        },
      });

      const token = getSessionTokenFromRequest(req);
      expect(token).toBe('mock-session-token-123');
    });

    it('returns null if cookie is not present', () => {
      const req = new NextRequest('http://localhost:3000/api/admin/stats');
      expect(getSessionTokenFromRequest(req)).toBeNull();
    });

    it('sets session cookie with HttpOnly and SameSite=strict', () => {
      const res = NextResponse.json({ success: true });
      const req = new NextRequest('https://example.com/api/admin/login');

      setAdminSessionCookie(res, 'my-token', req);
      const cookie = res.cookies.get(ADMIN_SESSION_COOKIE);

      expect(cookie).toBeDefined();
      expect(cookie?.value).toBe('my-token');
      expect(cookie?.httpOnly).toBe(true);
      expect(cookie?.sameSite).toBe('strict');
      expect(cookie?.secure).toBe(true);
    });

    it('clears session cookie by setting maxAge 0', () => {
      const res = NextResponse.json({ success: true });
      clearAdminSessionCookie(res);

      const cookie = res.cookies.get(ADMIN_SESSION_COOKIE);
      expect(cookie).toBeDefined();
      expect(cookie?.maxAge).toBe(0);
      expect(cookie?.value).toBe('');
    });
  });

  describe('CSRF and Origin Validation', () => {
    it('accepts matching Origin header', () => {
      const req = new NextRequest('https://trolley.vercel.app/api/vote', {
        headers: {
          origin: 'https://trolley.vercel.app',
          host: 'trolley.vercel.app',
        },
      });

      expect(isValidOrigin(req)).toBe(true);
    });

    it('rejects cross-origin requests from malicious domain', () => {
      const req = new NextRequest('https://trolley.vercel.app/api/vote', {
        headers: {
          origin: 'https://attacker.com',
          host: 'trolley.vercel.app',
        },
      });

      expect(isValidOrigin(req)).toBe(false);
    });

    it('validates referer if origin is omitted', () => {
      const validReq = new NextRequest('https://trolley.vercel.app/api/vote', {
        headers: {
          referer: 'https://trolley.vercel.app/',
          host: 'trolley.vercel.app',
        },
      });
      expect(isValidOrigin(validReq)).toBe(true);

      const invalidReq = new NextRequest('https://trolley.vercel.app/api/vote', {
        headers: {
          referer: 'https://attacker.com/',
          host: 'trolley.vercel.app',
        },
      });
      expect(isValidOrigin(invalidReq)).toBe(false);
    });
  });
});

