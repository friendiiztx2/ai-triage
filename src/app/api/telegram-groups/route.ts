import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { verifyApiAuth, getCompanyContext } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/telegram-groups
// List telegram groups for active company or unassigned groups
export async function GET(request: NextRequest) {
  const { session, errorResponse } = await verifyApiAuth(request, [
    'system_admin',
    'super_admin',
    'admin',
  ]);
  if (errorResponse || !session) return errorResponse!;

  const db = supabaseAdmin || supabase;
  const { searchParams } = new URL(request.url);
  const unassignedOnly = searchParams.get('unassigned') === 'true';

  try {
    // 1. Fetch unassigned groups (waiting to be linked)
    if (unassignedOnly) {
      const { data: unassigned, error } = await db
        .from('telegram_groups')
        .select('*')
        .or('company_id.is.null,company_id.eq.')
        .order('group_name', { ascending: true });

      if (error) throw error;
      return NextResponse.json({ success: true, groups: unassigned || [] });
    }

    // 2. Multi-tenant Context Filtering
    const companyId = getCompanyContext(request, session);
    const isSysAdmin = session.role === 'system_admin' || session.role === 'super_admin';

    let query = db.from('telegram_groups').select('*').order('created_at', { ascending: false });

    if (companyId && companyId !== 'all') {
      query = query.eq('company_id', companyId);
    } else if (!isSysAdmin) {
      const allowedIds = (session.company_id || '').split(',').map((id: string) => id.trim()).filter(Boolean);
      if (allowedIds.length > 0) {
        query = query.in('company_id', allowedIds);
      } else {
        return NextResponse.json({ success: true, groups: [] });
      }
    }

    const [groupsRes, companiesRes, membersCountRes] = await Promise.all([
      query,
      db.from('companies').select('id, name'),
      db.from('telegram_group_members').select('group_id, role'),
    ]);

    if (groupsRes.error) throw groupsRes.error;

    const companiesMap = new Map<string, string>();
    (companiesRes.data || []).forEach((c: any) => companiesMap.set(c.id, c.name));

    // Calculate member & executive stats per group
    const statsMap = new Map<string, { total: number; executives: number }>();
    (membersCountRes.data || []).forEach((m: any) => {
      const gId = String(m.group_id);
      const curr = statsMap.get(gId) || { total: 0, executives: 0 };
      curr.total += 1;
      if (m.role === 'executive') {
        curr.executives += 1;
      }
      statsMap.set(gId, curr);
    });

    const enriched = (groupsRes.data || []).map((g: any) => {
      const stats = statsMap.get(String(g.chat_id)) || { total: 0, executives: 0 };
      return {
        ...g,
        company_name: g.company_id ? companiesMap.get(g.company_id) || 'ไม่ระบุ' : 'ยังไม่ผูกบริษัท',
        member_count: stats.total,
        executive_count: stats.executives,
      };
    });

    return NextResponse.json({ success: true, groups: enriched });
  } catch (err: any) {
    console.error('[API /api/telegram-groups GET] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/telegram-groups
// Link/Bind an unassigned group or register a group with a company
export async function POST(request: NextRequest) {
  const { session, errorResponse } = await verifyApiAuth(request, [
    'system_admin',
    'super_admin',
    'admin',
  ]);
  if (errorResponse || !session) return errorResponse!;

  const db = supabaseAdmin || supabase;

  try {
    const body = await request.json();
    const { chat_id, company_id, group_name } = body;

    if (!chat_id || !company_id) {
      return NextResponse.json(
        { error: 'chat_id and company_id are required' },
        { status: 400 }
      );
    }

    const isSysAdmin = session.role === 'system_admin' || session.role === 'super_admin';
    if (!isSysAdmin) {
      const allowedIds = (session.company_id || '').split(',').map((id: string) => id.trim());
      if (!allowedIds.includes(company_id)) {
        return NextResponse.json(
          { error: 'Forbidden: คุณไม่มีสิทธิ์ผูกกลุ่มกับบริษัทนี้' },
          { status: 403 }
        );
      }
    }

    // Check if group already exists in database
    const { data: existing } = await db
      .from('telegram_groups')
      .select('*')
      .eq('chat_id', chat_id)
      .maybeSingle();

    if (existing) {
      const { error: updateErr } = await db
        .from('telegram_groups')
        .update({
          company_id,
          is_active: true,
          group_name: group_name || existing.group_name || `กลุ่ม Telegram (${chat_id})`,
        })
        .eq('chat_id', chat_id);

      if (updateErr) throw updateErr;
    } else {
      const { error: insertErr } = await db.from('telegram_groups').insert([
        {
          chat_id,
          group_name: group_name || `กลุ่ม Telegram (${chat_id})`,
          company_id,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ]);

      if (insertErr) throw insertErr;
    }

    // Audit log
    try {
      await db.from('activity_logs').insert([
        {
          company_id,
          user_id: session.id,
          user_name: session.name || 'Admin',
          action_type: 'BIND_TELEGRAM_GROUP',
          details: { chat_id, company_id, group_name },
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'ผูกกลุ่ม Telegram กับบริษัทเรียบร้อยแล้ว',
    });
  } catch (err: any) {
    console.error('[API /api/telegram-groups POST] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/telegram-groups
// Update group status (active/inactive), unbind, or rename
export async function PATCH(request: NextRequest) {
  const { session, errorResponse } = await verifyApiAuth(request, [
    'system_admin',
    'super_admin',
    'admin',
  ]);
  if (errorResponse || !session) return errorResponse!;

  const db = supabaseAdmin || supabase;

  try {
    const body = await request.json();
    const { chat_id, action, is_active, group_name } = body;

    if (!chat_id) {
      return NextResponse.json({ error: 'chat_id is required' }, { status: 400 });
    }

    const { data: existing, error: findErr } = await db
      .from('telegram_groups')
      .select('*')
      .eq('chat_id', chat_id)
      .single();

    if (findErr || !existing) {
      return NextResponse.json({ error: 'ไม่พบกลุ่มนี้ในระบบ' }, { status: 404 });
    }

    const isSysAdmin = session.role === 'system_admin' || session.role === 'super_admin';
    if (!isSysAdmin) {
      const allowedIds = (session.company_id || '').split(',').map((id: string) => id.trim());
      if (existing.company_id && !allowedIds.includes(existing.company_id)) {
        return NextResponse.json({ error: 'Forbidden: คุณไม่มีสิทธิ์แก้ไขกลุ่มนี้' }, { status: 403 });
      }
    }

    const updatePayload: any = {};

    if (action === 'unbind') {
      updatePayload.company_id = null;
    } else if (action === 'toggle_active') {
      updatePayload.is_active = Boolean(is_active);
    } else if (action === 'rename' && group_name) {
      updatePayload.group_name = group_name.trim();
    } else {
      if (typeof is_active === 'boolean') updatePayload.is_active = is_active;
      if (group_name) updatePayload.group_name = group_name.trim();
    }

    const { error: updateErr } = await db
      .from('telegram_groups')
      .update(updatePayload)
      .eq('chat_id', chat_id);

    if (updateErr) throw updateErr;

    // Audit log
    try {
      await db.from('activity_logs').insert([
        {
          company_id: existing.company_id,
          user_id: session.id,
          user_name: session.name || 'Admin',
          action_type: `UPDATE_TELEGRAM_GROUP_${(action || 'EDIT').toUpperCase()}`,
          details: { chat_id, ...updatePayload },
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {}

    return NextResponse.json({
      success: true,
      message: action === 'unbind' ? 'ยกเลิกการผูกกลุ่มเรียบร้อยแล้ว' : 'บันทึกการเปลี่ยนแปลงแล้ว',
    });
  } catch (err: any) {
    console.error('[API /api/telegram-groups PATCH] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
