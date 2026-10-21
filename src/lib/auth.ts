import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken, AuthTokenPayload } from '@/lib/jwt';

export type UserSession = AuthTokenPayload;

/**
 * Extracts and verifies the cryptographic auth token from request cookies or Authorization header.
 * Enforces Role-Based Access Control (RBAC).
 */
export async function verifyApiAuth(
  request: NextRequest,
  allowedRoles?: string[]
): Promise<{ session: AuthTokenPayload | null; errorResponse: NextResponse | null }> {
  try {
    // 1. Extract token strictly from HttpOnly auth_token cookie or Bearer authorization header
    let token: string | undefined = request.cookies.get('auth_token')?.value;

    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      }
    }

    // 2. Cryptographic signature and expiration check
    const session = await verifyAuthToken(token);

    if (!session || !session.id || !session.role) {
      return {
        session: null,
        errorResponse: NextResponse.json(
          { error: 'Unauthorized: กรุณาเข้าสู่ระบบก่อนทำรายการ' },
          { status: 401 }
        ),
      };
    }

    // 3. Role-Based Access Control (RBAC) Check
    if (allowedRoles && allowedRoles.length > 0) {
      const isSystemAdmin = session.role === 'system_admin';
      const isSuperAdmin = session.role === 'super_admin';

      if (!isSystemAdmin && !isSuperAdmin && !allowedRoles.includes(session.role)) {
        return {
          session,
          errorResponse: NextResponse.json(
            { error: 'Forbidden: คุณไม่มีสิทธิ์ในการเข้าถึงข้อมูลส่วนนี้' },
            { status: 403 }
          ),
        };
      }
    }

    return { session, errorResponse: null };
  } catch (err) {
    return {
      session: null,
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Session signature verification failed' },
        { status: 401 }
      ),
    };
  }
}

/**
 * Resolves active company context with strict Multi-Tenant Isolation.
 * Non-system-admin users are strictly locked to their assigned company_id.
 */
export function getCompanyContext(request: NextRequest, session: AuthTokenPayload): string | null {
  const isSysAdmin = session.role === 'system_admin' || session.role === 'super_admin';

  // System admins can switch companies freely or view 'all'
  if (isSysAdmin) {
    const paramCompany = request.nextUrl.searchParams.get('company_id');
    const cookieCompany = request.cookies.get('company_id')?.value;
    const target = paramCompany || cookieCompany;

    if (!target || target === 'all' || target === 'undefined' || target === 'null') {
      return null; // All companies
    }
    return target;
  }

  // Non-system admins are strictly locked to their authenticated company_id
  return session.company_id || null;
}

/**
 * Sanitizes input text to prevent PostgREST delimiter and operator injection
 */
export function sanitizePostgrestFilter(input: string): string {
  if (!input || typeof input !== 'string') return '';
  // Strip PostgREST control characters: comma, parentheses, colons, quotes
  // Preserves dots (.), @, -, and alphanumeric characters so emails and domain names remain intact
  return input
    .replace(/[(),:"'\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
