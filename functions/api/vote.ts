import { Choice } from '../../src/types';
import { isValidUUID } from '../../src/services/participant';
import { isValidOrigin } from '../utils/auth';
import { callAppsScript, UpstreamVoteResult } from '../utils/upstream';

interface Env {
  APPS_SCRIPT_URL?: string;
  APPS_SCRIPT_SHARED_SECRET?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Origin / CSRF check
  if (!isValidOrigin(request)) {
    return new Response(
      JSON.stringify({
        error: { code: 'FORBIDDEN_ORIGIN', message: 'Неприпустиме джерело запиту.' },
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Content-Type check
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return new Response(
      JSON.stringify({
        error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Очікується Content-Type: application/json' },
      }),
      { status: 415, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Parse JSON with size guard
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 8192) {
      return new Response(
        JSON.stringify({
          error: { code: 'PAYLOAD_TOO_LARGE', message: 'Розмір запиту перевищує ліміт.' },
        }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      );
    }
    body = JSON.parse(raw);
  } catch {
    return new Response(
      JSON.stringify({
        error: { code: 'INVALID_JSON', message: 'Некоректний синтаксис JSON.' },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!body || typeof body !== 'object') {
    return new Response(
      JSON.stringify({
        error: { code: 'INVALID_PAYLOAD', message: 'Тіло запиту повинно бути обʼєктом.' },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { participantId, choice } = body as {
    participantId?: unknown;
    choice?: unknown;
  };

  // Validate participantId
  if (typeof participantId !== 'string' || !isValidUUID(participantId)) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'INVALID_PARTICIPANT_ID',
          message: 'Ідентифікатор учасника повинен бути валідним UUID v4.',
        },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Validate choice
  if (choice !== 'stay' && choice !== 'switch') {
    return new Response(
      JSON.stringify({
        error: {
          code: 'INVALID_CHOICE',
          message: 'Вибір має бути рівно "stay" або "switch".',
        },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const appsScriptUrl = env.APPS_SCRIPT_URL || '';
  const appsScriptSecret = env.APPS_SCRIPT_SHARED_SECRET || '';

  try {
    const upstreamResult = await callAppsScript<UpstreamVoteResult>(
      appsScriptUrl,
      appsScriptSecret,
      'vote',
      { participantId, choice: choice as Choice }
    );

    return new Response(JSON.stringify(upstreamResult), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown upstream error';
    const isTimeout = msg.toLowerCase().includes('time');

    return new Response(
      JSON.stringify({
        error: {
          code: isTimeout ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_ERROR',
          message: 'Сервіс збереження тимчасово недоступний. Спробуйте ще раз.',
        },
      }),
      {
        status: isTimeout ? 504 : 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const onRequest: PagesFunction = async (context) => {
  if (context.request.method !== 'POST') {
    return new Response(
      JSON.stringify({
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Метод не підтримується. Використовуйте POST.' },
      }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          Allow: 'POST',
        },
      }
    );
  }
  return onRequestPost(context as Parameters<PagesFunction<Env>>[0]);
};

