import { NextRequest, NextResponse } from 'next/server';
import { getSessionTokenFromRequest } from '@/lib/server/cookies';
import { getAdminStats, verifyAdminSession } from '@/lib/server/adminService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = getSessionTokenFromRequest(request);
  const isAuthenticated = await verifyAdminSession(token);

  if (!isAuthenticated) {
    return NextResponse.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Доступ заборонено. Необхідна авторизація адміністратора.',
        },
      },
      {
        status: 401,
        headers: {
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        },
      }
    );
  }

  try {
    const stats = await getAdminStats();
    return NextResponse.json(stats, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Помилка отримання даних';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: { code: 'METHOD_NOT_ALLOWED', message: 'Метод POST не підтримується. Використовуйте GET.' } },
    { status: 405, headers: { Allow: 'GET' } }
  );
}

