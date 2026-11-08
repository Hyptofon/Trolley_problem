import { describe, it, expect } from 'vitest';
import {
  isValidUUID,
  voteRequestSchema,
  voteStatusRequestSchema,
  adminLoginRequestSchema,
} from '@/lib/shared/validation';

describe('Shared Validation Schemas', () => {
  describe('isValidUUID', () => {
    it('validates standard UUID v4', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUUID('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
    });

    it('rejects invalid UUIDs or wrong versions', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID(12345)).toBe(false);
      expect(isValidUUID(null)).toBe(false);
      expect(isValidUUID('550e8400-e29b-31d4-a716-446655440000')).toBe(false); // v3
    });
  });

  describe('voteRequestSchema', () => {
    it('accepts valid stay vote', () => {
      const parsed = voteRequestSchema.safeParse({
        participantId: '550e8400-e29b-41d4-a716-446655440000',
        choice: 'stay',
      });
      expect(parsed.success).toBe(true);
    });

    it('accepts valid switch vote', () => {
      const parsed = voteRequestSchema.safeParse({
        participantId: '550e8400-e29b-41d4-a716-446655440000',
        choice: 'switch',
      });
      expect(parsed.success).toBe(true);
    });

    it('rejects unknown choice', () => {
      const parsed = voteRequestSchema.safeParse({
        participantId: '550e8400-e29b-41d4-a716-446655440000',
        choice: 'jump',
      });
      expect(parsed.success).toBe(false);
    });

    it('rejects missing or invalid participantId', () => {
      const parsed = voteRequestSchema.safeParse({
        participantId: 'invalid-id',
        choice: 'stay',
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe('voteStatusRequestSchema', () => {
    it('accepts valid UUID v4', () => {
      const parsed = voteStatusRequestSchema.safeParse({
        participantId: '550e8400-e29b-41d4-a716-446655440000',
      });
      expect(parsed.success).toBe(true);
    });

    it('rejects invalid or missing participantId', () => {
      expect(voteStatusRequestSchema.safeParse({}).success).toBe(false);
      expect(
        voteStatusRequestSchema.safeParse({ participantId: 'invalid' }).success
      ).toBe(false);
    });
  });

  describe('adminLoginRequestSchema', () => {
    it('accepts non-empty password', () => {
      const parsed = adminLoginRequestSchema.safeParse({ password: 'my-password' });
      expect(parsed.success).toBe(true);
    });

    it('rejects empty password', () => {
      const parsed = adminLoginRequestSchema.safeParse({ password: '' });
      expect(parsed.success).toBe(false);
    });

    it('rejects password exceeding 256 characters', () => {
      const parsed = adminLoginRequestSchema.safeParse({ password: 'a'.repeat(300) });
      expect(parsed.success).toBe(false);
    });
  });
});

