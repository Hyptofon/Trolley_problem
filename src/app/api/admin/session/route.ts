import { NextRequest, NextResponse } from 'next/server';
import { getSessionTokenFromRequest } from '@/lib/server/cookies';
import { verifyAdminSession } from '@/lib/server/adminService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = getSessionTokenFromRequest(request);
  const authenticated = await verifyAdminSession(token);

  return NextResponse.json(
    { authenticated },
    {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-store, no-cache, must-revalidate',
      },
    }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: { code: 'METHOD_NOT_ALLOWED', message: 'Метод POST не підтримується. Використовуйте GET.' } },
    { status: 405, headers: { Allow: 'GET' } }
  );
}

