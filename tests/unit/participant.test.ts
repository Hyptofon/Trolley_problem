import { describe, it, expect, beforeEach } from 'vitest';
import {
  isValidUUID,
  getOrCreateParticipantId,
  getStoredVote,
  saveStoredVote,
  clearStoredVote,
  PARTICIPANT_STORAGE_KEY,
  VOTE_STORAGE_KEY,
} from '../../src/services/participant';

describe('Participant & Storage Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('isValidUUID', () => {
    it('accepts valid UUID v4', () => {
      expect(isValidUUID('c9bf9e57-1685-4c89-bafb-ff5af830be8a')).toBe(true);
      expect(isValidUUID('00000000-0000-4000-8000-000000000001')).toBe(true);
    });

    it('rejects invalid UUID formats', () => {
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('c9bf9e57-1685-3c89-bafb-ff5af830be8a')).toBe(false); // v3 not v4
      expect(isValidUUID('12345678-1234-4234-c234-123456789012')).toBe(false); // variant nibble not 8, 9, a, b
    });
  });

  describe('getOrCreateParticipantId', () => {
    it('creates and persists a new UUID v4 when storage is empty', () => {
      const id = getOrCreateParticipantId();
      expect(isValidUUID(id)).toBe(true);
      expect(localStorage.getItem(PARTICIPANT_STORAGE_KEY)).toBe(id);
    });

    it('returns existing UUID v4 on subsequent calls', () => {
      const first = getOrCreateParticipantId();
      const second = getOrCreateParticipantId();
      expect(second).toBe(first);
    });

    it('replaces an invalid stored ID with a new valid UUID v4', () => {
      localStorage.setItem(PARTICIPANT_STORAGE_KEY, 'corrupted-non-uuid');
      const fresh = getOrCreateParticipantId();
      expect(isValidUUID(fresh)).toBe(true);
      expect(fresh).not.toBe('corrupted-non-uuid');
    });
  });

  describe('Vote persistence', () => {
    it('returns null when no vote is stored', () => {
      expect(getStoredVote()).toBeNull();
    });

    it('saves and recovers a confirmed vote', () => {
      const vote = {
        participantId: 'c9bf9e57-1685-4c89-bafb-ff5af830be8a',
        choice: 'stay' as const,
        status: 'recorded' as const,
        timestamp: '2026-11-05T12:00:00.000Z',
      };
      saveStoredVote(vote);

      const recovered = getStoredVote();
      expect(recovered).toEqual(vote);
    });

    it('clears stored vote and participant ID on clearStoredVote', () => {
      getOrCreateParticipantId();
      saveStoredVote({
        participantId: 'c9bf9e57-1685-4c89-bafb-ff5af830be8a',
        choice: 'switch',
        status: 'recorded',
        timestamp: '2026-11-05T12:00:00.000Z',
      });

      clearStoredVote();
      expect(localStorage.getItem(PARTICIPANT_STORAGE_KEY)).toBeNull();
      expect(localStorage.getItem(VOTE_STORAGE_KEY)).toBeNull();
      expect(getStoredVote()).toBeNull();
    });
  });
});

