import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequestPost as onLoginPost, onRequest as onLoginRequest } from '../../functions/api/admin/login';
import { onRequestGet as onSessionGet, onRequest as onSessionRequest } from '../../functions/api/admin/session';
import { onRequestPost as onLogoutPost, onRequest as onLogoutRequest } from '../../functions/api/admin/logout';
import { onRequestGet as onStatsGet, onRequest as onStatsRequest } from '../../functions/api/admin/stats';
import { createSessionToken } from '../../functions/utils/auth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseJson = async (res: Response) => (await res.json()) as any;

describe('Admin API Endpoints Integration', () => {
  const env = {
    ADMIN_PASSWORD: 'test-admin-password',
    ADMIN_SESSION_SECRET: 'test-session-secret-key-at-least-32-chars-long',
    APPS_SCRIPT_URL: 'http://localhost:8787/mock-gas',
    APPS_SCRIPT_SHARED_SECRET: 'test-apps-script-secret',
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createMockContext = (request: Request): any => ({
    request,
    env,
    functionPath: '/api/admin',
    params: {},
    data: {},
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
    next: vi.fn(),
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/admin/login', () => {
    it('returns 405 Method Not Allowed for non-POST methods in login wrapper', async () => {
      const req = new Request('http://localhost:5173/api/admin/login', {
        method: 'GET',
      });
      const res = await onLoginRequest(createMockContext(req));
      expect(res.status).toBe(405);
    });

    it('returns 200 through onRequest router when method is POST', async () => {
      const req = new Request('http://localhost:5173/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'test-admin-password' }),
      });
      const res = await onLoginRequest(createMockContext(req));
      expect(res.status).toBe(200);
    });

    it('returns 400 when password is missing', async () => {
      const req = new Request('http://localhost:5173/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const res = await onLoginPost(createMockContext(req));
      expect(res.status).toBe(400);
      const body = await parseJson(res);
      expect(body.error.code).toBe('MISSING_PASSWORD');
    });

    it('returns 401 when password is wrong', async () => {
      const req = new Request('http://localhost:5173/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'wrong-password' }),
      });

      const res = await onLoginPost(createMockContext(req));
      expect(res.status).toBe(401);
      const body = await parseJson(res);
      expect(body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('returns 200 and sets HttpOnly SameSite=Strict cookie on correct password', async () => {
      const req = new Request('http://localhost:5173/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'test-admin-password' }),
      });

      const res = await onLoginPost(createMockContext(req));
      expect(res.status).toBe(200);
      const body = await parseJson(res);
      expect(body.success).toBe(true);

      const setCookie = res.headers.get('Set-Cookie') || '';
      expect(setCookie).toContain('trolley_admin_session=');
      expect(setCookie).toContain('HttpOnly');
      expect(setCookie).toContain('SameSite=Strict');
      expect(setCookie).toContain('Path=/');
    });
  });

  describe('GET /api/admin/session', () => {
    it('returns 405 Method Not Allowed for non-GET methods in session wrapper', async () => {
      const req = new Request('http://localhost:5173/api/admin/session', {
        method: 'POST',
      });
      const res = await onSessionRequest(createMockContext(req));
      expect(res.status).toBe(405);
    });

    it('returns 200 through onRequest router when method is GET', async () => {
      const req = new Request('http://localhost:5173/api/admin/session', {
        method: 'GET',
      });
      const res = await onSessionRequest(createMockContext(req));
      expect(res.status).toBe(200);
    });
    it('returns authenticated: false when no session cookie is present', async () => {
      const req = new Request('http://localhost:5173/api/admin/session', {
        method: 'GET',
      });

      const res = await onSessionGet(createMockContext(req));
      expect(res.status).toBe(200);
      const body = await parseJson(res);
      expect(body.authenticated).toBe(false);
    });

    it('returns authenticated: true when valid session cookie is present', async () => {
      const validToken = await createSessionToken(env.ADMIN_SESSION_SECRET, 3600);
      const req = new Request('http://localhost:5173/api/admin/session', {
        method: 'GET',
        headers: {
          Cookie: `trolley_admin_session=${validToken}`,
        },
      });

      const res = await onSessionGet(createMockContext(req));
      expect(res.status).toBe(200);
      const body = await parseJson(res);
      expect(body.authenticated).toBe(true);
    });

    it('returns authenticated: false when session token is tampered', async () => {
      const validToken = await createSessionToken(env.ADMIN_SESSION_SECRET, 3600);
      const tampered = validToken.slice(0, -4) + 'zzzz';
      const req = new Request('http://localhost:5173/api/admin/session', {
        method: 'GET',
        headers: {
          Cookie: `trolley_admin_session=${tampered}`,
        },
      });

      const res = await onSessionGet(createMockContext(req));
      expect(res.status).toBe(200);
      const body = await parseJson(res);
      expect(body.authenticated).toBe(false);
    });
  });

  describe('POST /api/admin/logout', () => {
    it('returns 405 Method Not Allowed for non-POST methods in logout wrapper', async () => {
      const req = new Request('http://localhost:5173/api/admin/logout', {
        method: 'GET',
      });
      const res = await onLogoutRequest(createMockContext(req));
      expect(res.status).toBe(405);
    });

    it('returns 200 through onRequest router when method is POST', async () => {
      const req = new Request('http://localhost:5173/api/admin/logout', {
        method: 'POST',
      });
      const res = await onLogoutRequest(createMockContext(req));
      expect(res.status).toBe(200);
    });
    it('returns Set-Cookie with Max-Age=0 to clear session', async () => {
      const req = new Request('http://localhost:5173/api/admin/logout', {
        method: 'POST',
      });

      const res = await onLogoutPost(createMockContext(req));
      expect(res.status).toBe(200);
      const body = await parseJson(res);
      expect(body.success).toBe(true);

      const setCookie = res.headers.get('Set-Cookie') || '';
      expect(setCookie).toContain('trolley_admin_session=');
      expect(setCookie).toContain('Max-Age=0');
    });
  });

  describe('GET /api/admin/stats (Access Control & Data)', () => {
    it('returns 405 Method Not Allowed for non-GET methods', async () => {
      const req = new Request('http://localhost:5173/api/admin/stats', {
        method: 'POST',
      });

      const res = await onStatsRequest(createMockContext(req));
      expect(res.status).toBe(405);
    });

    it('returns 401 Unauthorized when request has no session cookie', async () => {
      const req = new Request('http://localhost:5173/api/admin/stats', {
        method: 'GET',
      });

      const res = await onStatsGet(createMockContext(req));
      expect(res.status).toBe(401);
      const body = await parseJson(res);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 Unauthorized when session is expired', async () => {
      const expiredToken = await createSessionToken(env.ADMIN_SESSION_SECRET, -100);
      const req = new Request('http://localhost:5173/api/admin/stats', {
        method: 'GET',
        headers: {
          Cookie: `trolley_admin_session=${expiredToken}`,
        },
      });

      const res = await onStatsGet(createMockContext(req));
      expect(res.status).toBe(401);
      const body = await parseJson(res);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns aggregate stats with Cache-Control: no-store when authenticated', async () => {
      const validToken = await createSessionToken(env.ADMIN_SESSION_SECRET, 3600);
      const req = new Request('http://localhost:5173/api/admin/stats', {
        method: 'GET',
        headers: {
          Cookie: `trolley_admin_session=${validToken}`,
        },
      });

      const res = await onStatsGet(createMockContext(req));
      expect(res.status).toBe(200);
      expect(res.headers.get('Cache-Control')).toContain('no-store');

      const body = await parseJson(res);
      expect(body).toHaveProperty('total');
      expect(body).toHaveProperty('stay');
      expect(body).toHaveProperty('switch');
      expect(body).toHaveProperty('stayPercent');
      expect(body).toHaveProperty('switchPercent');
      expect(body).toHaveProperty('updatedAt');

      // Ensure no raw voter tokens are present
      expect(body.participantId).toBeUndefined();
    });
  });
});

