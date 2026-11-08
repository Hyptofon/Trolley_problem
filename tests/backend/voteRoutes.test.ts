import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as votePost, GET as voteGet } from '@/app/api/vote/route';
import { POST as statusPost, GET as statusGet } from '@/app/api/vote/status/route';
import { getInMemoryRedisAdapter } from '@/lib/server/redis/client';

describe('Vote Route Handlers Integration (/api/vote & /api/vote/status)', () => {
  beforeEach(() => {
    getInMemoryRedisAdapter().clear();
  });

  const createVoteRequest = (
    body: unknown,
    origin = 'http://localhost:3000',
    contentType = 'application/json'
  ) => {
    return new NextRequest('http://localhost:3000/api/vote', {
      method: 'POST',
      headers: {
        origin,
        host: 'localhost:3000',
        'content-type': contentType,
      },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  };

  const createStatusRequest = (
    body: unknown,
    origin = 'http://localhost:3000',
    contentType = 'application/json'
  ) => {
    return new NextRequest('http://localhost:3000/api/vote/status', {
      method: 'POST',
      headers: {
        origin,
        host: 'localhost:3000',
        'content-type': contentType,
      },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  };

  describe('/api/vote', () => {
    it('returns 405 Method Not Allowed on GET', async () => {
      const res = await voteGet();
      expect(res.status).toBe(405);
      const json = await res.json();
      expect(json.error.code).toBe('METHOD_NOT_ALLOWED');
    });

    it('rejects foreign origins with 403 Forbidden', async () => {
      const req = createVoteRequest(
        { participantId: '550e8400-e29b-41d4-a716-446655440000', choice: 'stay' },
        'http://evil-attacker.com'
      );
      const res = await votePost(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe('FORBIDDEN_ORIGIN');
    });

    it('rejects non-JSON content types with 415', async () => {
      const req = createVoteRequest(
        'some=data',
        'http://localhost:3000',
        'application/x-www-form-urlencoded'
      );
      const res = await votePost(req);
      expect(res.status).toBe(415);
      const json = await res.json();
      expect(json.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
    });

    it('rejects invalid JSON with 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/vote', {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          host: 'localhost:3000',
          'content-type': 'application/json',
        },
        body: '{invalid json',
      });
      const res = await votePost(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('INVALID_JSON');
    });

    it('rejects payloads larger than 4KB with 413', async () => {
      const largePayload = {
        participantId: '550e8400-e29b-41d4-a716-446655440000',
        choice: 'stay',
        padding: 'x'.repeat(5000),
      };
      const req = createVoteRequest(largePayload);
      const res = await votePost(req);
      expect(res.status).toBe(413);
      const json = await res.json();
      expect(json.error.code).toBe('PAYLOAD_TOO_LARGE');
    });

    it('rejects invalid UUID or invalid choice with 400', async () => {
      const invalidUuidReq = createVoteRequest({
        participantId: 'not-a-uuid',
        choice: 'stay',
      });
      const res1 = await votePost(invalidUuidReq);
      expect(res1.status).toBe(400);

      const invalidChoiceReq = createVoteRequest({
        participantId: '550e8400-e29b-41d4-a716-446655440000',
        choice: 'jump',
      });
      const res2 = await votePost(invalidChoiceReq);
      expect(res2.status).toBe(400);
    });

    it('records first vote successfully and returns status "recorded"', async () => {
      const req = createVoteRequest({
        participantId: '550e8400-e29b-41d4-a716-446655440000',
        choice: 'switch',
      });
      const res = await votePost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({
        status: 'recorded',
        choice: 'switch',
      });
    });

    it('returns "already_voted" and original choice on duplicate vote without updating choice', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';

      // 1st vote: stay
      const res1 = await votePost(createVoteRequest({ participantId: id, choice: 'stay' }));
      expect(res1.status).toBe(200);
      expect((await res1.json()).status).toBe('recorded');

      // 2nd vote: attempts to switch to 'switch'
      const res2 = await votePost(createVoteRequest({ participantId: id, choice: 'switch' }));
      expect(res2.status).toBe(200);
      const json2 = await res2.json();
      expect(json2.status).toBe('already_voted');
      expect(json2.choice).toBe('stay'); // original choice preserved!
    });
  });

  describe('/api/vote/status', () => {
    it('returns 405 Method Not Allowed on GET', async () => {
      const res = await statusGet();
      expect(res.status).toBe(405);
    });

    it('returns voted: false when participant has not voted', async () => {
      const req = createStatusRequest({
        participantId: '550e8400-e29b-41d4-a716-446655440001',
      });
      const res = await statusPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ voted: false });
    });

    it('returns voted: true and the recorded choice after voting', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440002';

      // Vote first
      await votePost(createVoteRequest({ participantId: id, choice: 'switch' }));

      // Check status
      const req = createStatusRequest({ participantId: id });
      const res = await statusPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({
        voted: true,
        choice: 'switch',
      });
    });
  });
});
