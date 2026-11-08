import { describe, it, expect } from 'vitest';
import {
  getParticipantDigest,
  hashAdminPassword,
  verifyAdminPassword,
  generateSessionToken,
  hashSessionToken,
} from '@/lib/server/crypto';

describe('Server Crypto Utilities', () => {
  const SECRET = 'test-secret-that-is-at-least-32-chars-long-123456';

  describe('Participant Digest (HMAC-SHA256)', () => {
    it('generates consistent HMAC-SHA256 for the same participant UUID and secret', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const digest1 = getParticipantDigest(uuid, SECRET);
      const digest2 = getParticipantDigest(uuid, SECRET);

      expect(digest1).toBe(digest2);
      expect(digest1).toHaveLength(64); // SHA-256 hex
    });

    it('generates different digests for different secrets', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const digest1 = getParticipantDigest(uuid, SECRET);
      const digest2 = getParticipantDigest(uuid, 'another-secret-key-at-least-32-chars-long');

      expect(digest1).not.toBe(digest2);
    });

    it('throws error if secret is missing', () => {
      expect(() => getParticipantDigest('550e8400-e29b-41d4-a716-446655440000', '')).toThrow(
        'VOTE_ID_HMAC_SECRET не налаштовано на сервері'
      );
    });
  });

  describe('Admin Password scrypt Hashing & Timing-Safe Verification', () => {
    it('hashes and successfully verifies a correct password', () => {
      const password = 'SuperSecretAdminPassword2026!';
      const hash = hashAdminPassword(password);

      expect(hash).toMatch(/^\d+:\d+:\d+\$[a-f0-9]+\$[a-f0-9]+$/);
      expect(verifyAdminPassword(password, hash)).toBe(true);
    });

    it('rejects an incorrect password', () => {
      const password = 'SuperSecretAdminPassword2026!';
      const hash = hashAdminPassword(password);

      expect(verifyAdminPassword('WrongPassword123!', hash)).toBe(false);
    });

    it('rejects malformed hashes gracefully', () => {
      expect(verifyAdminPassword('any', 'not-a-valid-hash')).toBe(false);
      expect(verifyAdminPassword('any', '16384:8:1$salt')).toBe(false);
      expect(verifyAdminPassword('any', '')).toBe(false);
    });

    it('throws if password to hash is shorter than 8 characters', () => {
      expect(() => hashAdminPassword('short')).toThrow(
        'Пароль має містити щонайменше 8 символів.'
      );
    });
  });

  describe('Session Tokens', () => {
    it('generates a 64-char hex random session token', () => {
      const token1 = generateSessionToken();
      const token2 = generateSessionToken();

      expect(token1).toHaveLength(64);
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2);
    });

    it('hashes session tokens deterministically with SHA-256', () => {
      const token = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const hash1 = hashSessionToken(token);
      const hash2 = hashSessionToken(token);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });
  });
});
