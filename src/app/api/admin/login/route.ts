import { NextRequest, NextResponse } from 'next/server';
import { isValidOrigin } from '@/lib/server/csrf';
import { checkRateLimit } from '@/lib/server/rateLimit';
import { authenticateAdmin, AdminAuthError } from '@/lib/server/adminService';
import { setAdminSessionCookie } from '@/lib/server/cookies';
import { adminLoginRequestSchema } from '@/lib/shared/validation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  if (!isValidOrigin(request)) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN_ORIGIN', message: 'Неприпустиме джерело запиту.' } },
      { status: 403 }
    );
  }

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return NextResponse.json(
      { error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Очікується Content-Type: application/json' } },
      { status: 415 }
    );
  }

  // Rate limiting against brute force: 5 attempts per 60s per IP
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'anonymous';
  const rateLimit = await checkRateLimit('admin_login', ip, 5, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: 'Забагато спроб входу. Зачекайте 1 хвилину.' } },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 2048) {
      return NextResponse.json(
        { error: { code: 'PAYLOAD_TOO_LARGE', message: 'Розмір запиту перевищує ліміт.' } },
        { status: 413 }
      );
    }
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Некоректний синтаксис JSON.' } },
      { status: 400 }
    );
  }

  const parsed = adminLoginRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message || 'Вкажіть пароль' } },
      { status: 400 }
    );
  }

  try {
    const sessionToken = await authenticateAdmin(parsed.data.password);
    const response = NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, no-store',
        },
      }
    );

    setAdminSessionCookie(response, sessionToken, request);
    return response;
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.statusCode }
      );
    }

    const message = err instanceof Error ? err.message : 'Помилка авторизації';
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: { code: 'METHOD_NOT_ALLOWED', message: 'Метод GET не підтримується. Використовуйте POST.' } },
    { status: 405, headers: { Allow: 'POST' } }
  );
}
