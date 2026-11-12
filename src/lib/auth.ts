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
    // 1. Extract token from HttpOnly auth_token cookie or Bearer authorization header
    let token: string | undefined = request.cookies.get('auth_token')?.value;

    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      }
    }

    // 2. Cryptographic signature and expiration check.
    // SECURITY: never fall back to the unsigned, client-readable user_session cookie.
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
 * A company id that never exists. Used to make tenant-scoped queries return
 * nothing when a non-admin user has no company assigned (fail closed).
 */
export const NO_ACCESS_COMPANY_ID = '00000000-0000-0000-0000-000000000000';

/** system_admin and super_admin can see every company. */
export function isGlobalAdmin(session: Pick<AuthTokenPayload, 'role'> | null | undefined): boolean {
  return session?.role === 'system_admin' || session?.role === 'super_admin';
}

/**
 * Companies a non-global user may access (their token's company_id may be a comma list).
 * Returns [] for users with no company. Do not call for global admins.
 */
export function getAllowedCompanyIds(session: AuthTokenPayload): string[] {
  return (session.company_id || '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id && id !== 'all' && id !== 'null' && id !== 'undefined');
}

/**
 * Company ids to use with `.in('company_id', ...)` for writes/reads by non-global users.
 * Never empty: users without a company get NO_ACCESS_COMPANY_ID so queries match nothing.
 */
export function getScopedCompanyIds(session: AuthTokenPayload): string[] {
  const ids = getAllowedCompanyIds(session);
  return ids.length > 0 ? ids : [NO_ACCESS_COMPANY_ID];
}

/**
 * Resolves active company context with strict Multi-Tenant Isolation.
 * - Global admins: may pick any company via ?company_id / cookie, or null = all companies.
 * - Everyone else: always a single company they belong to (the requested one if allowed,
 *   otherwise their first). Never null, so callers can't accidentally return all tenants.
 */
export function getCompanyContext(request: NextRequest, session: AuthTokenPayload): string | null {
  const isSysAdmin = isGlobalAdmin(session);

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

  // Non-system admins are strictly locked to their authenticated company(ies)
  const allowed = getAllowedCompanyIds(session);
  if (allowed.length === 0) {
    return NO_ACCESS_COMPANY_ID; // fail closed: no company => no data
  }
  const requested =
    request.nextUrl.searchParams.get('company_id') || request.cookies.get('company_id')?.value;
  if (requested && allowed.includes(requested)) {
    return requested;
  }
  return allowed[0];
}

/** Role hierarchy. Higher number = more power. Unknown roles rank 0. */
export const VALID_ROLES = ['system_admin', 'super_admin', 'admin', 'staff'] as const;
const ROLE_RANK: Record<string, number> = { staff: 1, admin: 2, super_admin: 3, system_admin: 4 };

export function roleRank(role: string | null | undefined): number {
  return (role && ROLE_RANK[role]) || 0;
}

/**
 * True if `session` may assign `targetRole` to someone (or manage a user who has it).
 * Nobody can grant or manage a role above their own; only system_admin manages system_admin.
 */
export function canManageRole(session: Pick<AuthTokenPayload, 'role'>, targetRole: string | null | undefined): boolean {
  const target = roleRank(targetRole || 'staff');
  return target > 0 && target <= roleRank(session.role);
}

/** Standard header for authenticated, tenant-specific API responses (never CDN-cached). */
export const PRIVATE_NO_STORE = { 'Cache-Control': 'private, no-store' } as const;

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
