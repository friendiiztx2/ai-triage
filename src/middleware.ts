import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthToken } from '@/lib/jwt';

// Public endpoints and assets that do not require authentication
const PUBLIC_API_ROUTES = new Set([
  '/api/users/login',
  '/api/users/logout',
  '/api/schema',
]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Enforce HTTP Security Headers on every response
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Allow Next.js static assets, images, favicon, and files with extensions
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    (pathname.includes('.') && !pathname.startsWith('/api'))
  ) {
    return response;
  }

  // Extract auth_token from HttpOnly cookie or Authorization header
  let token = request.cookies.get('auth_token')?.value;
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  // Cryptographically verify session token
  const validSession = await verifyAuthToken(token);

  // If visiting login page:
  // - If validSession exists, redirect to '/'
  // - If validSession is null/expired, clear any stale auth_token / user_session cookies to prevent redirect loops
  if (pathname === '/login') {
    if (validSession) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    response.cookies.delete('auth_token');
    response.cookies.delete('user_session');
    return response;
  }

  // Allow explicit public API endpoints
  if (PUBLIC_API_ROUTES.has(pathname)) {
    return response;
  }

  // Protect backend API routes: reject unauthenticated requests with 401 JSON
  if (pathname.startsWith('/api')) {
    if (!validSession) {
      return NextResponse.json(
        { error: 'Unauthorized: กรุณาเข้าสู่ระบบก่อนทำรายการ' },
        { status: 401 }
      );
    }
    return response;
  }

  // Protect UI pages: redirect unauthenticated requests to /login and clear stale cookies
  if (!validSession) {
    const redirectRes = NextResponse.redirect(new URL('/login', request.url));
    redirectRes.cookies.delete('auth_token');
    redirectRes.cookies.delete('user_session');
    return redirectRes;
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};