import { StoredVote } from '../types';

export const PARTICIPANT_STORAGE_KEY = 'trolley_participant_id';
export const VOTE_STORAGE_KEY = 'trolley_user_vote';

/**
 * Validates whether a string is a valid UUID v4.
 */
export function isValidUUID(id: string): boolean {
  const uuidV4Regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(id);
}

/**
 * Gets or creates a cryptographically random participant UUID.
 * Never stores or collects personal data.
 */
export function getOrCreateParticipantId(): string {
  try {
    const existing = localStorage.getItem(PARTICIPANT_STORAGE_KEY);
    if (existing && isValidUUID(existing)) {
      return existing;
    }
  } catch {
    // LocalStorage might be restricted; continue with generated ID
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
    // Non-fatal if storage fails
  }

  return newId;
}

/**
 * Retrieves previously confirmed vote from local storage, if present.
 */
export function getStoredVote(): StoredVote | null {
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
  try {
    localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(vote));
  } catch {
    // Storage quota or restriction
  }
}

/**
 * Clears stored vote and participant ID (useful for tests or demo resets).
 */
export function clearStoredVote(): void {
  try {
    localStorage.removeItem(PARTICIPANT_STORAGE_KEY);
    localStorage.removeItem(VOTE_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

