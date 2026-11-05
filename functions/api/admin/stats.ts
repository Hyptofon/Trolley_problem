import { isAuthenticatedAdmin } from '../../utils/auth';
import { callAppsScript, UpstreamStatsResult } from '../../utils/upstream';

interface Env {
  APPS_SCRIPT_URL?: string;
  APPS_SCRIPT_SHARED_SECRET?: string;
  ADMIN_SESSION_SECRET?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const sessionSecret =
    env.ADMIN_SESSION_SECRET || 'default-dev-session-secret-change-in-prod-32-chars';

  const authenticated = await isAuthenticatedAdmin(request, sessionSecret);
  if (!authenticated) {
    return new Response(
      JSON.stringify({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Доступ заборонено. Будь ласка, увійдіть як адміністратор.',
        },
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  }

  const appsScriptUrl = env.APPS_SCRIPT_URL || '';
  const appsScriptSecret = env.APPS_SCRIPT_SHARED_SECRET || '';

  try {
    const stats = await callAppsScript<UpstreamStatsResult>(
      appsScriptUrl,
      appsScriptSecret,
      'stats'
    );

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown upstream error';
    const isTimeout = msg.toLowerCase().includes('time');

    return new Response(
      JSON.stringify({
        error: {
          code: isTimeout ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_ERROR',
          message: 'Не вдалося завантажити статистику зі сховища даних.',
        },
      }),
      {
        status: isTimeout ? 504 : 502,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  }
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

