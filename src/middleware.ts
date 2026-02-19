import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

const locales = ['lt', 'en', 'ru', 'lv', 'et', 'pl'];
const defaultLocale = 'lt';

function getLocale(request: NextRequest): string {
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  // @ts-ignore
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
  
  try {
    return match(languages, locales, defaultLocale);
  } catch (e) {
    return defaultLocale;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip internal paths, API routes, and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return;
  }

  // 2. Check for existing locale cookie
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;

  // 3. If no cookie, detect from browser and set it
  if (!cookieLocale || !locales.includes(cookieLocale)) {
    const detectedLocale = getLocale(request);
    const response = NextResponse.next();
    // Set cookie so client-side context can pick it up immediately
    response.cookies.set('NEXT_LOCALE', detectedLocale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
    return response;
  }

  // 4. Note: If we want to implement URL prefixes like /pl/dashboard,
  // we would perform a redirect here if the pathname doesn't start with a locale.
  // e.g., if (!locales.some(l => pathname.startsWith(`/${l}`))) { ... redirect ... }
  // However, this requires moving src/app/* to src/app/[locale]/*

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply middleware to all routes except internal/api
    '/((?!_next|api|favicon.ico|.*\\..*).*)',
  ],
};
