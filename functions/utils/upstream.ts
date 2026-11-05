import { Choice } from '../../src/types';

export interface UpstreamVoteResult {
  status: 'recorded' | 'already_voted';
  choice: Choice;
}

export interface UpstreamStatsResult {
  total: number;
  stay: number;
  switch: number;
  stayPercent: number;
  switchPercent: number;
  updatedAt: string;
}

// In-memory local mock state for dev environments without external Google setup
interface MockStorageState {
  votes: Map<string, Choice>;
}

const mockState: MockStorageState = {
  votes: new Map<string, Choice>(),
};

/**
 * Executes a call to Google Apps Script Web App.
 * Handles ContentService 302 redirects, timeouts, and JSON parsing.
 */
export async function callAppsScript<T>(
  url: string,
  secret: string,
  action: 'vote' | 'stats',
  payload: Record<string, unknown> = {},
  timeoutMs: number = 15000
): Promise<T> {
  // If URL is explicitly local mock or unset in dev
  if (!url || url.startsWith('mock://') || url === 'http://localhost:8787/mock-gas') {
    return handleMockCall(action, payload) as T;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const requestBody = JSON.stringify({
    action,
    secret,
    ...payload,
  });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: requestBody,
      redirect: 'follow', // Crucial for Google Apps Script 302 redirects
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(`Upstream Apps Script returned HTTP ${res.status}: ${errorText.slice(0, 200)}`);
    }

    const data = await res.json().catch(async () => {
      throw new Error('Upstream Apps Script did not return valid JSON');
    });

    if (data && typeof data === 'object' && 'error' in data) {
      const err = (data as { error: { code?: string; message?: string } }).error;
      throw new Error(`Upstream Error: [${err.code || 'UNKNOWN'}] ${err.message || 'Apps Script error'}`);
    }

    return data as T;
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Upstream Apps Script timed out');
    }
    throw err;
  }
}

function handleMockCall(action: 'vote' | 'stats', payload: Record<string, unknown>): unknown {
  if (action === 'vote') {
    const participantId = String(payload.participantId || '');
    const choice = payload.choice as Choice;

    if (mockState.votes.has(participantId)) {
      const existingChoice = mockState.votes.get(participantId)!;
      return {
        status: 'already_voted',
        choice: existingChoice,
      };
    }

    mockState.votes.set(participantId, choice);
    return {
      status: 'recorded',
      choice,
    };
  }

  if (action === 'stats') {
    let stay = 0;
    let switchCount = 0;
    for (const ch of mockState.votes.values()) {
      if (ch === 'stay') stay++;
      if (ch === 'switch') switchCount++;
    }
    const total = stay + switchCount;
    const stayPercent = total === 0 ? 0 : Math.round((stay / total) * 1000) / 10;
    const switchPercent = total === 0 ? 0 : Math.round((switchCount / total) * 1000) / 10;

    return {
      total,
      stay,
      switch: switchCount,
      stayPercent,
      switchPercent,
      updatedAt: new Date().toISOString(),
    };
  }

  throw new Error(`Unknown mock action: ${action}`);
}

