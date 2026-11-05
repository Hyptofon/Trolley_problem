import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequest, onRequestPost } from '../../functions/api/vote';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseJson = async (res: Response) => (await res.json()) as any;

describe('POST /api/vote Function Endpoint', () => {
  const defaultEnv = {
    APPS_SCRIPT_URL: 'http://localhost:8787/mock-gas',
    APPS_SCRIPT_SHARED_SECRET: 'test-secret-12345',
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createMockContext = (request: Request, env = defaultEnv): any => ({
    request,
    env,
    functionPath: '/api/vote',
    params: {},
    data: {},
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
    next: vi.fn(),
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects non-POST methods with 405 Method Not Allowed', async () => {
    const req = new Request('http://localhost:5173/api/vote', { method: 'GET' });
    const res = await onRequest(createMockContext(req));
    expect(res.status).toBe(405);
    const body = await parseJson(res);
    expect(body.error.code).toBe('METHOD_NOT_ALLOWED');
  });

  it('rejects foreign origins (CSRF protection) with 403', async () => {
    const req = new Request('http://localhost:5173/api/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://attacker.com',
      },
      body: JSON.stringify({
        participantId: 'c9bf9e57-1685-4c89-bafb-ff5af830be8a',
        choice: 'stay',
      }),
    });

    const res = await onRequestPost(createMockContext(req));
    expect(res.status).toBe(403);
    const body = await parseJson(res);
    expect(body.error.code).toBe('FORBIDDEN_ORIGIN');
  });

  it('rejects non-JSON Content-Type with 415', async () => {
    const req = new Request('http://localhost:5173/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'invalid-body',
    });

    const res = await onRequestPost(createMockContext(req));
    expect(res.status).toBe(415);
    const body = await parseJson(res);
    expect(body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  it('rejects invalid JSON syntax with 400', async () => {
    const req = new Request('http://localhost:5173/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"invalid json',
    });

    const res = await onRequestPost(createMockContext(req));
    expect(res.status).toBe(400);
    const body = await parseJson(res);
    expect(body.error.code).toBe('INVALID_JSON');
  });

  it('rejects invalid or missing participantId with 400', async () => {
    const req = new Request('http://localhost:5173/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: 'not-a-valid-uuid', choice: 'stay' }),
    });

    const res = await onRequestPost(createMockContext(req));
    expect(res.status).toBe(400);
    const body = await parseJson(res);
    expect(body.error.code).toBe('INVALID_PARTICIPANT_ID');
  });

  it('rejects invalid choice values with 400', async () => {
    const req = new Request('http://localhost:5173/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId: 'c9bf9e57-1685-4c89-bafb-ff5af830be8a',
        choice: 'jump',
      }),
    });

    const res = await onRequestPost(createMockContext(req));
    expect(res.status).toBe(400);
    const body = await parseJson(res);
    expect(body.error.code).toBe('INVALID_CHOICE');
  });

  it('records a valid vote and never leaks secrets in response', async () => {
    const participantId = '00000000-0000-4000-8000-000000000001';
    const req = new Request('http://localhost:5173/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, choice: 'stay' }),
    });

    const res = await onRequestPost(createMockContext(req));
    expect(res.status).toBe(200);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (await res.json()) as any;
    expect(body.status).toBe('recorded');
    expect(body.choice).toBe('stay');
    expect(res.headers.get('Cache-Control')).toBe('no-store');

    // Verify secret is not in the JSON response
    const rawText = JSON.stringify(body);
    expect(rawText).not.toContain('test-secret-12345');
  });

  it('handles duplicate voting by returning already_voted status', async () => {
    const participantId = '00000000-0000-4000-8000-000000000002';
    const makeReq = () =>
      new Request('http://localhost:5173/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, choice: 'switch' }),
      });

    // First request
    const firstRes = await onRequestPost(createMockContext(makeReq()));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firstBody = (await firstRes.json()) as any;
    expect(firstBody.status).toBe('recorded');

    // Second request with same participantId
    const secondRes = await onRequestPost(createMockContext(makeReq()));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const secondBody = (await secondRes.json()) as any;
    expect(secondBody.status).toBe('already_voted');
    expect(secondBody.choice).toBe('switch');
  });

  it('handles upstream errors gracefully with 502/504 and no secret leak', async () => {
    // Point to a simulated failing upstream
    const failingEnv = {
      APPS_SCRIPT_URL: 'http://upstream.example.com/fail',
      APPS_SCRIPT_SHARED_SECRET: 'super-secret',
    };

    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
      new Error('Connection timed out')
    );

    const req = new Request('http://localhost:5173/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantId: 'c9bf9e57-1685-4c89-bafb-ff5af830be8a',
        choice: 'stay',
      }),
    });

    const res = await onRequestPost(createMockContext(req, failingEnv));
    expect([502, 504]).toContain(res.status);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (await res.json()) as any;
    expect(body.error).toBeDefined();
    expect(JSON.stringify(body)).not.toContain('super-secret');
  });
});

