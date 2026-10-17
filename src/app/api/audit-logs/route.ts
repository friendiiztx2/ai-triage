import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

interface CacheEntry {
  timestamp: number;
  data: any;
}
const serverCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 15000;

export function clearAuditCache() {
  serverCache.clear();
}

export async function GET(request: Request) {
  const cacheKey = request.url;
  const now = Date.now();
  const cached = serverCache.get(cacheKey);

  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return NextResponse.json(cached.data, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=45',
        'X-Cache': 'HIT'
      }
    });
  }

  const db = supabaseAdmin || supabase;
  try {
    // 1. Attempt to fetch from 'activity_logs' table (Admin bypass RLS)
    const { data: actData } = await db
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

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
    const { data: auditData } = await db
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

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

export async function POST(request: Request) {
  serverCache.clear();
  const db = supabaseAdmin || supabase;
  try {
    const body = await request.json();
    const { admin_name, admin_email, action, details } = body;

    if (!admin_name || !action || !details) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const rawUserId = body.user_id || body.user_email || admin_email || '';
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawUserId);

    const activityEntry: any = {
      company_id: body.company_id || null,
      user_id: isValidUUID ? rawUserId : null,
      user_name: admin_name || body.user_name || 'Admin',
      action_type: action || body.action_type || 'UPDATE',
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
