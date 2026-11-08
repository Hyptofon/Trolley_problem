import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as loginPost, GET as loginGet } from '@/app/api/admin/login/route';
import { GET as sessionGet, POST as sessionPost } from '@/app/api/admin/session/route';
import { POST as logoutPost, GET as logoutGet } from '@/app/api/admin/logout/route';
import { GET as statsGet, POST as statsPost } from '@/app/api/admin/stats/route';
import { hashAdminPassword } from '@/lib/server/crypto';
import { ADMIN_SESSION_COOKIE } from '@/lib/server/cookies';
import { getInMemoryRedisAdapter } from '@/lib/server/redis/client';

describe('Admin Route Handlers Integration', () => {
  const TEST_PASSWORD = 'AdminSecurePassword2026!';

  beforeEach(() => {
    getInMemoryRedisAdapter().clear();
    process.env.ADMIN_PASSWORD_HASH = hashAdminPassword(TEST_PASSWORD);
  });

  const createRequest = (
    url: string,
    method: string,
    options: {
      body?: unknown;
      origin?: string;
      cookieToken?: string;
      contentType?: string;
    } = {}
  ) => {
    const {
      body,
      origin = 'http://localhost:3000',
      cookieToken,
      contentType = 'application/json',
    } = options;

    const headers: Record<string, string> = {
      origin,
      host: 'localhost:3000',
    };

    if (contentType) {
      headers['content-type'] = contentType;
    }
    if (cookieToken) {
      headers['cookie'] = `${ADMIN_SESSION_COOKIE}=${cookieToken}`;
    }

    return new NextRequest(`http://localhost:3000${url}`, {
      method,
      headers,
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    });
  };

  describe('POST /api/admin/login', () => {
    it('returns 405 Method Not Allowed on GET', async () => {
      const res = await loginGet();
      expect(res.status).toBe(405);
    });

    it('returns 403 on foreign origin', async () => {
      const req = createRequest('/api/admin/login', 'POST', {
        body: { password: TEST_PASSWORD },
        origin: 'http://malicious.com',
      });
      const res = await loginPost(req);
      expect(res.status).toBe(403);
    });

    it('returns 415 on non-JSON content-type', async () => {
      const req = createRequest('/api/admin/login', 'POST', {
        body: 'password=123',
        contentType: 'text/plain',
      });
      const res = await loginPost(req);
      expect(res.status).toBe(415);
    });

    it('returns 400 when password is missing or empty', async () => {
      const req = createRequest('/api/admin/login', 'POST', {
        body: { password: '' },
      });
      const res = await loginPost(req);
      expect(res.status).toBe(400);
    });

    it('returns 401 when password is wrong', async () => {
      const req = createRequest('/api/admin/login', 'POST', {
        body: { password: 'WrongPassword123' },
      });
      const res = await loginPost(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('returns 200 and sets HttpOnly cookie on valid password', async () => {
      const req = createRequest('/api/admin/login', 'POST', {
        body: { password: TEST_PASSWORD },
      });
      const res = await loginPost(req);
      expect(res.status).toBe(200);

      const cookie = res.cookies.get(ADMIN_SESSION_COOKIE);
      expect(cookie).toBeDefined();
      expect(cookie?.value).toBeTruthy();
      expect(cookie?.httpOnly).toBe(true);
      expect(cookie?.sameSite).toBe('strict');
    });
  });

  describe('Session Lifecycle & Protected Routes', () => {
    it('verifies session status through /api/admin/session', async () => {
      // 1. Without cookie -> unauthenticated
      const unauthReq = createRequest('/api/admin/session', 'GET');
      const unauthRes = await sessionGet(unauthReq);
      expect(unauthRes.status).toBe(200);
      expect(await unauthRes.json()).toEqual({ authenticated: false });

      // 2. Perform login to get valid cookie
      const loginReq = createRequest('/api/admin/login', 'POST', {
        body: { password: TEST_PASSWORD },
      });
      const loginRes = await loginPost(loginReq);
      const sessionToken = loginRes.cookies.get(ADMIN_SESSION_COOKIE)!.value;

      // 3. With cookie -> authenticated: true
      const authReq = createRequest('/api/admin/session', 'GET', { cookieToken: sessionToken });
      const authRes = await sessionGet(authReq);
      expect(authRes.status).toBe(200);
      expect(await authRes.json()).toEqual({ authenticated: true });
    });

    it('protects /api/admin/stats: 401 without session, 200 with session', async () => {
      // 1. Access stats without cookie -> 401
      const unauthReq = createRequest('/api/admin/stats', 'GET');
      const unauthRes = await statsGet(unauthReq);
      expect(unauthRes.status).toBe(401);
      const unauthJson = await unauthRes.json();
      expect(unauthJson.error.code).toBe('UNAUTHORIZED');

      // 2. Login to get token
      const loginReq = createRequest('/api/admin/login', 'POST', {
        body: { password: TEST_PASSWORD },
      });
      const loginRes = await loginPost(loginReq);
      const sessionToken = loginRes.cookies.get(ADMIN_SESSION_COOKIE)!.value;

      // 3. Access stats with token -> 200
      const authReq = createRequest('/api/admin/stats', 'GET', { cookieToken: sessionToken });
      const authRes = await statsGet(authReq);
      expect(authRes.status).toBe(200);
      const stats = await authRes.json();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('stay');
      expect(stats).toHaveProperty('switch');
      expect(stats).toHaveProperty('stayPercent');
      expect(stats).toHaveProperty('switchPercent');
      expect(authRes.headers.get('cache-control')).toContain('no-store');
    });

    it('invalidates session on /api/admin/logout', async () => {
      // 1. Login
      const loginReq = createRequest('/api/admin/login', 'POST', {
        body: { password: TEST_PASSWORD },
      });
      const loginRes = await loginPost(loginReq);
      const sessionToken = loginRes.cookies.get(ADMIN_SESSION_COOKIE)!.value;

      // 2. Logout
      const logoutReq = createRequest('/api/admin/logout', 'POST', { cookieToken: sessionToken });
      const logoutRes = await logoutPost(logoutReq);
      expect(logoutRes.status).toBe(200);
      expect(logoutRes.cookies.get(ADMIN_SESSION_COOKIE)?.maxAge).toBe(0);

      // 3. Subsequent session check returns authenticated: false
      const checkReq = createRequest('/api/admin/session', 'GET', { cookieToken: sessionToken });
      const checkRes = await sessionGet(checkReq);
      expect(await checkRes.json()).toEqual({ authenticated: false });

      // 4. Subsequent stats request returns 401
      const statsReq = createRequest('/api/admin/stats', 'GET', { cookieToken: sessionToken });
      const statsRes = await statsGet(statsReq);
      expect(statsRes.status).toBe(401);
    });

    it('returns 405 on unsupported HTTP methods', async () => {
      expect((await sessionPost()).status).toBe(405);
      expect((await logoutGet()).status).toBe(405);
      expect((await statsPost()).status).toBe(405);
    });
  });
});
