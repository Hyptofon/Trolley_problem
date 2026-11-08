import {
  AdminLoginRequest,
  AdminLoginResponse,
  AdminSessionResponse,
  AdminStatsResponse,
  ApiErrorResponse,
  VoteRequest,
  VoteResponse,
  VoteStatusRequest,
  VoteStatusResponse,
} from '../shared/types';

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

const DEFAULT_TIMEOUT_MS = 15000;

async function requestJson<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    });

    clearTimeout(id);

    let data: unknown = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json().catch(() => null);
    }

    if (!res.ok) {
      const errData = data as ApiErrorResponse | null;
      const code = errData?.error?.code || `HTTP_${res.status}`;
      const message =
        errData?.error?.message ||
        `Помилка сервера (${res.status}). Будь ласка, спробуйте пізніше.`;
      throw new ApiError(code, message, res.status);
    }

    return data as T;
  } catch (error) {
    clearTimeout(id);
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(
        'TIMEOUT',
        'Час очікування відповіді вичерпано. Перевірте зʼєднання та повторіть спробу.',
        408
      );
    }
    const message =
      error instanceof Error ? error.message : 'Не вдалося підключитися до сервера';
    throw new ApiError(
      'NETWORK_ERROR',
      `Помилка мережі: ${message}. Перевірте інтернет-зʼєднання.`,
      0
    );
  }
}

/**
 * Submits a vote anonymously to the Next.js serverless API.
 */
export async function submitVote(payload: VoteRequest): Promise<VoteResponse> {
  return requestJson<VoteResponse>('/api/vote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/**
 * Checks with the server whether this browser participantId has already voted.
 */
export async function checkVoteStatus(
  payload: VoteStatusRequest
): Promise<VoteStatusResponse> {
  return requestJson<VoteStatusResponse>('/api/vote/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/**
 * Checks if current admin session is valid.
 */
export async function checkAdminSession(): Promise<AdminSessionResponse> {
  return requestJson<AdminSessionResponse>('/api/admin/session', {
    method: 'GET',
  });
}

/**
 * Authenticates admin with password.
 */
export async function loginAdmin(
  payload: AdminLoginRequest
): Promise<AdminLoginResponse> {
  return requestJson<AdminLoginResponse>('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/**
 * Logs admin out and invalidates session in Redis.
 */
export async function logoutAdmin(): Promise<{ success: boolean }> {
  return requestJson<{ success: boolean }>('/api/admin/logout', {
    method: 'POST',
  });
}

/**
 * Fetches aggregate voting statistics (authorized only).
 */
export async function fetchAdminStats(): Promise<AdminStatsResponse> {
  return requestJson<AdminStatsResponse>('/api/admin/stats', {
    method: 'GET',
  });
}

