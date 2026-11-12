import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { verifyApiAuth, isGlobalAdmin, getCompanyContext, getAllowedCompanyIds } from '@/lib/auth';
import { QUOTA_ACTION_TYPES } from '@/lib/companyQuotaStore';

interface CacheEntry {
  timestamp: number;
  data: any;
}
const serverCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15000;

export function clearAuditCache() {
  serverCache.clear();
}

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await verifyApiAuth(request, ['system_admin', 'super_admin', 'admin']);
  if (errorResponse || !session) return errorResponse!;

  // SECURITY: non-global admins are always scoped to one of their own companies
  // (never "all", even when they have no company assigned).
  const isSysAdmin = isGlobalAdmin(session);
  const companyId = isSysAdmin
    ? request.nextUrl.searchParams.get('company_id')
    : getCompanyContext(request, session);

  const cacheKey = request.url + `_comp_${companyId || 'all'}`;
  const now = Date.now();
  const cached = serverCache.get(cacheKey);

  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return NextResponse.json(cached.data, {
      headers: {
        'Cache-Control': 'private, no-store',
        'X-Cache': 'HIT'
      }
    });
  }

  const db = supabaseAdmin || supabase;
  try {
    // 1. Attempt to fetch from 'activity_logs' table
    let actQuery = db
      .from('activity_logs')
      .select('id, company_id, user_id, user_name, action_type, details, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (companyId && companyId !== 'all') {
      actQuery = actQuery.eq('company_id', companyId);
    }

    const { data: actData } = await actQuery;

    if (actData && actData.length > 0) {
      const mappedLogs = actData.map((item: any) => ({
        id: item.id || `act-${Math.random()}`,
        admin_name: item.user_name || item.admin_name || 'Admin',
        admin_email: item.user_id || item.admin_email || 'admin@system',
        action: item.action_type || item.action || 'UPDATE',
        details: typeof item.details === 'object' ? (item.details.info || JSON.stringify(item.details)) : String(item.details),
        created_at: item.created_at || new Date().toISOString()
      }));
      serverCache.set(cacheKey, { timestamp: now, data: mappedLogs });
      return NextResponse.json(mappedLogs);
    }

    // 2. Attempt to fetch from 'audit_logs' table
    let auditQuery = db
      .from('audit_logs')
      .select('id, company_id, user_id, user_name, action, details, created_at')
      .limit(200)
      .order('created_at', { ascending: false });

    if (companyId && companyId !== 'all') {
      auditQuery = auditQuery.eq('company_id', companyId);
    }

    const { data: auditData } = await auditQuery;

    if (auditData && auditData.length > 0) {
      serverCache.set(cacheKey, { timestamp: now, data: auditData });
      return NextResponse.json(auditData);
    }

    return NextResponse.json([]);
  } catch (err: any) {
    console.error('Audit logs fetch error:', err);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  serverCache.clear();
  const { session, errorResponse } = await verifyApiAuth(request);
  if (errorResponse || !session) return errorResponse!;

  const db = supabaseAdmin || supabase;
  try {
    const body = await request.json();
    const { action, details } = body;

    if (!action || !details) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // SECURITY: quota is derived from these log types, so only the trusted server
    // routes may write them. Block users from forging a quota change via this endpoint.
    const normalizedAction = String(action).trim().toUpperCase();
    if ((QUOTA_ACTION_TYPES as readonly string[]).includes(normalizedAction)) {
      return NextResponse.json({ error: 'Forbidden: action type is reserved' }, { status: 403 });
    }

    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(session.id);

    const activityEntry: any = {
      // SECURITY: users can only write logs into their own company
      company_id: isGlobalAdmin(session)
        ? body.company_id || null
        : getAllowedCompanyIds(session).includes(body.company_id)
          ? body.company_id
          : getAllowedCompanyIds(session)[0] || null,
      user_id: isValidUUID ? session.id : null,
      user_name: session.name || session.email || 'User',
      action_type: action || 'UPDATE',
      details: typeof details === 'object' ? details : { info: details },
      created_at: new Date().toISOString()
    };

    const { data, error } = await db.from('activity_logs').insert([activityEntry]).select();
    if (error) {
      console.warn('activity_logs insert warning:', error);
    }
    return NextResponse.json(data?.[0] || { success: true, ...activityEntry });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
