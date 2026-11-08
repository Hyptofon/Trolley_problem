import { NextRequest, NextResponse } from 'next/server';
import { isValidOrigin } from '@/lib/server/csrf';
import { clearAdminSessionCookie, getSessionTokenFromRequest } from '@/lib/server/cookies';
import { revokeAdminSession } from '@/lib/server/adminService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!isValidOrigin(request)) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN_ORIGIN', message: 'Неприпустиме джерело запиту.' } },
      { status: 403 }
    );
  }

  const token = getSessionTokenFromRequest(request);
  await revokeAdminSession(token);

  const response = NextResponse.json(
    { success: true },
    {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-store',
      },
    }
  );

  clearAdminSessionCookie(response, request);
  return response;
}

export async function GET() {
  return NextResponse.json(
    { error: { code: 'METHOD_NOT_ALLOWED', message: 'Метод GET не підтримується. Використовуйте POST.' } },
    { status: 405, headers: { Allow: 'POST' } }
  );
}
