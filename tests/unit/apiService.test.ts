import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  submitVote,
  loginAdmin,
  checkAdminSession,
  logoutAdmin,
  fetchAdminStats,
  ApiError,
} from '../../src/services/api';

describe('Frontend API Client Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('submitVote', () => {
    it('returns vote confirmation on 200 response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({ status: 'recorded', choice: 'stay' }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      const res = await submitVote({
        participantId: '00000000-0000-4000-8000-000000000001',
        choice: 'stay',
      });

      expect(res).toEqual({ status: 'recorded', choice: 'stay' });
    });

    it('throws ApiError with server error details on non-200', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: { code: 'INVALID_CHOICE', message: 'Невірний вибір' },
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      await expect(
        submitVote({
          participantId: '00000000-0000-4000-8000-000000000001',
          choice: 'stay',
        })
      ).rejects.toThrow(ApiError);
    });

    it('wraps network errors into ApiError', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
        new TypeError('Failed to fetch')
      );

      await expect(
        submitVote({
          participantId: '00000000-0000-4000-8000-000000000001',
          choice: 'switch',
        })
      ).rejects.toThrow('Помилка мережі');
    });
  });

  describe('Admin API calls', () => {
    it('performs loginAdmin correctly', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const res = await loginAdmin({ password: 'secret-pass' });
      expect(res).toEqual({ success: true });
    });

    it('checks admin session correctly', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ authenticated: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const res = await checkAdminSession();
      expect(res.authenticated).toBe(true);
    });

    it('logs admin out correctly', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const res = await logoutAdmin();
      expect(res.success).toBe(true);
    });

    it('fetches admin stats successfully', async () => {
      const mockStats = {
        total: 10,
        stay: 4,
        switch: 6,
        stayPercent: 40,
        switchPercent: 60,
        updatedAt: '2026-11-05T12:00:00Z',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockStats), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const res = await fetchAdminStats();
      expect(res).toEqual(mockStats);
    });
  });
});

