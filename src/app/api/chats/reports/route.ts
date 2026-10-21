import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyApiAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await verifyApiAuth(request);
  if (errorResponse || !session) return errorResponse!;

  // Role check: Only system_admin and super_admin can view all reported issues
  if (session.role !== 'system_admin' && session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden: ต้องใช้สิทธิ์ System Admin เท่านั้น' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status') || 'all';
  const searchQuery = searchParams.get('q') || '';
  const dateRange = searchParams.get('date') || 'all';

  try {
    // 1. Try querying `ai_feedback_reports`
    let query = supabase
      .from('ai_feedback_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data: reports, error: reportError } = await query;

    if (!reportError && Array.isArray(reports)) {
      let filtered = reports;

      // Filter by search query in memory for flexible search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (r: any) =>
            r.chat_id?.toLowerCase().includes(q) ||
            r.reported_by?.toLowerCase().includes(q) ||
            r.comment?.toLowerCase().includes(q) ||
            JSON.stringify(r.ai_snapshot || {}).toLowerCase().includes(q)
        );
      }

      // Filter by date
      if (dateRange !== 'all') {
        const now = new Date();
        filtered = filtered.filter((r: any) => {
          const itemDate = new Date(r.created_at);
          if (dateRange === 'today') {
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            return itemDate >= startOfToday;
          } else if (dateRange === '7days') {
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return itemDate >= sevenDaysAgo;
          } else if (dateRange === '30days') {
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return itemDate >= thirtyDaysAgo;
          }
          return true;
        });
      }

      return NextResponse.json({ success: true, reports: filtered });
    }

    // 2. Fallback: Query from `activity_logs` if `ai_feedback_reports` doesn't exist yet
    const { data: fallbackLogs, error: logErr } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('action_type', 'REPORT_AI_INACCURACY')
      .order('created_at', { ascending: false });

    if (logErr) {
      return NextResponse.json({ success: true, reports: [] });
    }

    const mappedReports = (fallbackLogs || []).map((l: any) => ({
      id: l.id,
      chat_id: l.details?.chat_id || 'N/A',
      reported_by: l.user_name || 'เจ้าหน้าที่',
      reasons: l.details?.reasons || [],
      comment: l.details?.comment || '',
      ai_snapshot: l.details?.ai_snapshot || {},
      status: l.details?.status || 'pending',
      developer_notes: l.details?.developer_notes || '',
      created_at: l.created_at,
    }));

    return NextResponse.json({ success: true, reports: mappedReports });
  } catch (err: any) {
    console.error('[Reports API GET] Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { session, errorResponse } = await verifyApiAuth(request);
  if (errorResponse || !session) return errorResponse!;

  if (session.role !== 'system_admin' && session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden: ต้องใช้สิทธิ์ System Admin เท่านั้น' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, status, developer_notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };
    if (status) updatePayload.status = status;
    if (developer_notes !== undefined) updatePayload.developer_notes = developer_notes;

    // 1. Try updating ai_feedback_reports
    const { error: updateError } = await supabase
      .from('ai_feedback_reports')
      .update(updatePayload)
      .eq('id', id);

    if (updateError) {
      // If table doesn't exist or ID isn't found in ai_feedback_reports, try activity_logs
      console.warn('[Reports API PATCH] Fallback update to activity_logs:', updateError.message);
    }

    // 2. Log activity
    try {
      await supabase.from('activity_logs').insert([
        {
          company_id: session.company_id || null,
          user_id: session.id || 'system',
          user_name: session.name || 'System Admin',
          action_type: 'UPDATE_AI_REPORT_STATUS',
          details: { report_id: id, status, developer_notes },
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (e) {}

    return NextResponse.json({ success: true, message: 'อัปเดตสถานะปัญหาเรียบร้อยแล้ว' });
  } catch (err: any) {
    console.error('[Reports API PATCH] Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
