import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { verifyApiAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/telegram-groups/[id]/members
// Fetch members of a specific telegram group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await verifyApiAuth(request, [
    'system_admin',
    'super_admin',
    'admin',
  ]);
  if (errorResponse || !session) return errorResponse!;

  const { id: chatId } = await params;
  if (!chatId) {
    return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
  }

  const db = supabaseAdmin || supabase;

  try {
    // 1. Verify group existence and access rights
    const { data: group, error: groupErr } = await db
      .from('telegram_groups')
      .select('*')
      .eq('chat_id', chatId)
      .maybeSingle();

    if (groupErr) throw groupErr;
    if (!group) {
      return NextResponse.json({ error: 'ไม่พบกลุ่มนี้ในระบบ' }, { status: 404 });
    }

    const isSysAdmin = session.role === 'system_admin' || session.role === 'super_admin';
    if (!isSysAdmin && group.company_id) {
      const allowedIds = (session.company_id || '').split(',').map((cid: string) => cid.trim());
      if (!allowedIds.includes(group.company_id)) {
        return NextResponse.json({ error: 'Forbidden: คุณไม่มีสิทธิ์เข้าถึงสมาชิกของกลุ่มนี้' }, { status: 403 });
      }
    }

    // 2. Fetch members ordered by role (executive first) and last_seen_at
    const { data: members, error: membersErr } = await db
      .from('telegram_group_members')
      .select('*')
      .eq('group_id', chatId)
      .order('role', { ascending: true }); // 'executive' before 'member'

    if (membersErr) throw membersErr;

    // Sort to ensure 'executive' is always at the top, then by last_seen_at desc
    const sortedMembers = (members || []).sort((a: any, b: any) => {
      if (a.role === 'executive' && b.role !== 'executive') return -1;
      if (a.role !== 'executive' && b.role === 'executive') return 1;
      const timeA = new Date(a.last_seen_at || a.joined_at || 0).getTime();
      const timeB = new Date(b.last_seen_at || b.joined_at || 0).getTime();
      return timeB - timeA;
    });

    return NextResponse.json({
      success: true,
      group,
      members: sortedMembers,
    });
  } catch (err: any) {
    console.error('[API /api/telegram-groups/[id]/members GET] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/telegram-groups/[id]/members
// Update a member's role: 'executive' (ผู้บริหาร) or 'member' (สมาชิกทั่วไป)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await verifyApiAuth(request, [
    'system_admin',
    'super_admin',
    'admin',
  ]);
  if (errorResponse || !session) return errorResponse!;

  const { id: chatId } = await params;
  if (!chatId) {
    return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
  }

  const db = supabaseAdmin || supabase;

  try {
    const body = await request.json();
    const { telegram_user_id, role } = body;

    if (!telegram_user_id || !role) {
      return NextResponse.json(
        { error: 'telegram_user_id and role are required' },
        { status: 400 }
      );
    }

    if (role !== 'executive' && role !== 'member') {
      return NextResponse.json(
        { error: "role must be either 'executive' or 'member'" },
        { status: 400 }
      );
    }

    // Verify group access
    const { data: group } = await db
      .from('telegram_groups')
      .select('company_id')
      .eq('chat_id', chatId)
      .maybeSingle();

    const isSysAdmin = session.role === 'system_admin' || session.role === 'super_admin';
    if (!isSysAdmin && group?.company_id) {
      const allowedIds = (session.company_id || '').split(',').map((cid: string) => cid.trim());
      if (!allowedIds.includes(group.company_id)) {
        return NextResponse.json({ error: 'Forbidden: คุณไม่มีสิทธิ์จัดการสมาชิกของกลุ่มนี้' }, { status: 403 });
      }
    }

    const now = new Date().toISOString();
    const { error: updateErr } = await db
      .from('telegram_group_members')
      .update({
        role,
        updated_at: now,
      })
      .eq('group_id', chatId)
      .eq('telegram_user_id', telegram_user_id);

    if (updateErr) throw updateErr;

    // Audit log
    try {
      await db.from('activity_logs').insert([
        {
          company_id: group?.company_id || session.company_id,
          user_id: session.id,
          user_name: session.name || 'Admin',
          action_type: 'UPDATE_TELEGRAM_MEMBER_ROLE',
          details: {
            group_id: chatId,
            telegram_user_id,
            new_role: role,
          },
          created_at: now,
        },
      ]);
    } catch {}

    return NextResponse.json({
      success: true,
      message: `ปรับสิทธิ์เป็น ${role === 'executive' ? '⭐️ ผู้บริหาร (Executive)' : '👤 สมาชิกทั่วไป (Member)'} สำเร็จแล้ว`,
    });
  } catch (err: any) {
    console.error('[API /api/telegram-groups/[id]/members PATCH] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
