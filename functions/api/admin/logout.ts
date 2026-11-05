import { createLogoutCookieHeader, isValidOrigin } from '../../utils/auth';

export const onRequestPost: PagesFunction = async (context) => {
  const { request } = context;

  if (!isValidOrigin(request)) {
    return new Response(
      JSON.stringify({
        error: { code: 'FORBIDDEN_ORIGIN', message: 'Неприпустиме джерело запиту.' },
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const url = new URL(request.url);
  const isSecure = url.protocol === 'https:' && !url.hostname.includes('localhost') && !url.hostname.includes('127.0.0.1');

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': createLogoutCookieHeader(isSecure),
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
  return onRequestPost(context);
};

