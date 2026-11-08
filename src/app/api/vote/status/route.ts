import { NextRequest, NextResponse } from 'next/server';
import { isValidOrigin } from '@/lib/server/csrf';
import { checkRateLimit } from '@/lib/server/rateLimit';
import { getVoteStatus, VoteServiceError } from '@/lib/server/voteService';

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

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'anonymous';
  const rateLimit = await checkRateLimit('vote_status', ip, 60, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: 'Занадто багато запитів.' } },
      { status: 429 }
    );
  }

  const participantId = (body as { participantId?: unknown })?.participantId;

  try {
    const result = await getVoteStatus(String(participantId || ''));
    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    if (err instanceof VoteServiceError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: err.statusCode }
      );
    }
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Помилка перевірки статусу' } },
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

