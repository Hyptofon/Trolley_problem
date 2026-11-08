import 'server-only';
import { NextRequest } from 'next/server';

export function isValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin) {
    // If no Origin header, check Referer
    const referer = request.headers.get('referer');
    if (!referer) return true;
    try {
      const refererUrl = new URL(referer);
      const host = request.headers.get('host') || request.nextUrl.host;
      return refererUrl.host === host;
    } catch {
      return false;
    }
  }

  try {
    const originUrl = new URL(origin);
    const host =
      request.headers.get('x-forwarded-host') ||
      request.headers.get('host') ||
      request.nextUrl.host;

    // Direct match with current host
    if (originUrl.host === host) {
      return true;
    }

    // Allow Vercel preview deployments if needed
    if (
      originUrl.hostname.endsWith('.vercel.app') &&
      host.endsWith('.vercel.app')
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
