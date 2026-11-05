import { isAuthenticatedAdmin } from '../../utils/auth';

interface Env {
  ADMIN_SESSION_SECRET?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const sessionSecret =
    env.ADMIN_SESSION_SECRET || 'default-dev-session-secret-change-in-prod-32-chars';

  const authenticated = await isAuthenticatedAdmin(request, sessionSecret);

  return new Response(JSON.stringify({ authenticated }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
};

export const onRequest: PagesFunction = async (context) => {
  if (context.request.method !== 'GET') {
    return new Response(
      JSON.stringify({
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Метод не підтримується. Використовуйте GET.' },
      }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          Allow: 'GET',
        },
      }
    );
  }
  return onRequestGet(context as Parameters<PagesFunction<Env>>[0]);
};

