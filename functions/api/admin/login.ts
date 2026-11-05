import {
  createSessionCookieHeader,
  createSessionToken,
  isValidOrigin,
  verifyPassword,
} from '../../utils/auth';

interface Env {
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!isValidOrigin(request)) {
    return new Response(
      JSON.stringify({
        error: { code: 'FORBIDDEN_ORIGIN', message: 'Неприпустиме джерело запиту.' },
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return new Response(
      JSON.stringify({
        error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Очікується Content-Type: application/json' },
      }),
      { status: 415, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 4096) {
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

  const password = (body as { password?: unknown })?.password;
  if (typeof password !== 'string' || !password) {
    return new Response(
      JSON.stringify({
        error: { code: 'MISSING_PASSWORD', message: 'Необхідно вказати пароль.' },
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const adminPassword = env.ADMIN_PASSWORD || 'admin-test-password';
  const sessionSecret =
    env.ADMIN_SESSION_SECRET || 'default-dev-session-secret-change-in-prod-32-chars';

  const isMatch = await verifyPassword(password, adminPassword);
  if (!isMatch) {
    return new Response(
      JSON.stringify({
        error: { code: 'INVALID_CREDENTIALS', message: 'Невірний пароль адміністратора.' },
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const token = await createSessionToken(sessionSecret);
  const url = new URL(request.url);
  const isSecure = url.protocol === 'https:' && !url.hostname.includes('localhost') && !url.hostname.includes('127.0.0.1');

  const cookieHeader = createSessionCookieHeader(token, isSecure);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookieHeader,
      'Cache-Control': 'no-store',
    },
  });
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

