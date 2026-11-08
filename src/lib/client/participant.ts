import { StoredVote } from '../shared/types';
import { isValidUUID } from '../shared/validation';

export { isValidUUID };

export const PARTICIPANT_STORAGE_KEY = 'trolley_participant_id';
export const VOTE_STORAGE_KEY = 'trolley_user_vote';

/**
 * Gets or creates a cryptographically random participant UUID v4.
 * Never stores or collects personal data.
 */
export function getOrCreateParticipantId(): string {
  if (typeof window === 'undefined') {
    return '00000000-0000-4000-8000-000000000000';
  }

  try {
    const existing = localStorage.getItem(PARTICIPANT_STORAGE_KEY);
    if (existing && isValidUUID(existing)) {
      return existing;
    }
  } catch {
    // LocalStorage might be restricted
  }

  let newId: string;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    newId = crypto.randomUUID();
  } else {
    // Fallback compliant with UUID v4 format
    newId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  try {
    localStorage.setItem(PARTICIPANT_STORAGE_KEY, newId);
  } catch {
    // Non-fatal if storage quota is exceeded
  }

  return newId;
}

/**
 * Retrieves previously confirmed vote from local storage, if present.
 */
export function getStoredVote(): StoredVote | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(VOTE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredVote;
    if (
      parsed &&
      (parsed.choice === 'stay' || parsed.choice === 'switch') &&
      isValidUUID(parsed.participantId)
    ) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Persists confirmed vote into local storage.
 */
export function saveStoredVote(vote: StoredVote): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(vote));
  } catch {
    // Non-fatal if storage fails
  }
}

/**
 * Clears stored vote and participant ID (useful for tests or resets).
 */
export function clearStoredVote(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(PARTICIPANT_STORAGE_KEY);
    localStorage.removeItem(VOTE_STORAGE_KEY);
  } catch {
    // Ignore
  }
}
