import 'server-only';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export const ADMIN_SESSION_COOKIE = 'trolley_admin_session';
export const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8 hours

export function getSessionTokenFromRequest(request: NextRequest): string | null {
  const cookie = request.cookies.get(ADMIN_SESSION_COOKIE);
  return cookie?.value || null;
}

export function getSessionTokenFromCookies(): string | null {
  try {
    const cookieStore = cookies();
    const cookie = cookieStore.get(ADMIN_SESSION_COOKIE);
    return cookie?.value || null;
  } catch {
    return null;
  }
}

export function setAdminSessionCookie(
  response: NextResponse,
  token: string,
  request?: NextRequest
): void {
  const isHttps =
    process.env.NODE_ENV === 'production' ||
    (request &&
      (request.headers.get('x-forwarded-proto') === 'https' ||
        request.nextUrl.protocol === 'https:'));

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'strict',
    secure: !!isHttps,
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearAdminSessionCookie(
  response: NextResponse,
  request?: NextRequest
): void {
  const isHttps =
    process.env.NODE_ENV === 'production' ||
    (request &&
      (request.headers.get('x-forwarded-proto') === 'https' ||
        request.nextUrl.protocol === 'https:'));

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'strict',
    secure: !!isHttps,
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
}

