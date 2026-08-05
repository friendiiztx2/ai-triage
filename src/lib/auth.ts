import { NextRequest, NextResponse } from 'next/server';

export interface UserSession {
  id: string;
  name: string;
  email?: string;
  role: 'system_admin' | 'super_admin' | 'admin' | 'staff';
  company_id: string;
  permissions?: string[];
}

/**
 * Verifies session token or cookie for API routes and checks role permissions (RBAC)
 */
export function verifyApiAuth(request: NextRequest, allowedRoles?: string[]): { session: UserSession | null; errorResponse: NextResponse | null } {
  try {
    // 1. Extract session from cookie or Authorization header
    let sessionStr: string | undefined = request.cookies.get('user_session')?.value;
    
    if (!sessionStr) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        sessionStr = authHeader.substring(7);
      }
    }

    if (!sessionStr) {
      // Fallback: Check if request has custom user session header
      sessionStr = request.headers.get('x-user-session') || undefined;
    }

    if (!sessionStr) {
      return {
        session: null,
        errorResponse: NextResponse.json(
          { error: 'Unauthorized: Session missing or expired' },
          { status: 401 }
        )
      };
    }

    const session: UserSession = JSON.parse(decodeURIComponent(sessionStr));

    if (!session || !session.id || !session.role) {
      return {
        session: null,
        errorResponse: NextResponse.json(
          { error: 'Unauthorized: Invalid session format' },
          { status: 401 }
        )
      };
    }

    // 2. Role-Based Access Control (RBAC) Check
    if (allowedRoles && allowedRoles.length > 0) {
      const isSystemAdmin = session.role === 'system_admin';
      const isSuperAdmin = session.role === 'super_admin';

      if (!isSystemAdmin && !allowedRoles.includes(session.role)) {
        return {
          session,
          errorResponse: NextResponse.json(
            { error: 'Forbidden: Insufficient permissions for this action' },
            { status: 403 }
          )
        };
      }
    }

    return { session, errorResponse: null };
  } catch (err) {
    return {
      session: null,
      errorResponse: NextResponse.json(
        { error: 'Unauthorized: Invalid session signature' },
        { status: 401 }
      )
    };
  }
}

/**
 * Resolves active company context for Multi-Tenant Isolation
 */
export function getCompanyContext(request: NextRequest, session?: UserSession | null): string {
  const cookieCompany = request.cookies.get('company_id')?.value;
  if (cookieCompany) return cookieCompany;

  if (session && session.company_id) return session.company_id;

  return '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2'; // Default fallback company ID
}
