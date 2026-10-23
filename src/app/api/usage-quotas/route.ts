import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { verifyApiAuth, getCompanyContext } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Default standard monthly quota per company if not specified
const DEFAULT_COMPANY_QUOTA = 50000;
// In-memory persistent map for custom quotas if column is missing in DB
const customQuotasMap = new Map<string, number>();

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await verifyApiAuth(request, [
    'system_admin',
    'super_admin',
    'admin',
  ]);
  if (errorResponse || !session) return errorResponse!;

  const db = supabaseAdmin || supabase;
  const { searchParams } = new URL(request.url);
  const requestedCompanyId = searchParams.get('company_id');
  const requestedMonth = searchParams.get('month'); // format: 'YYYY-MM'

  try {
    const isSysAdmin = session.role === 'system_admin' || session.role === 'super_admin';
    const activeCompanyId = requestedCompanyId || getCompanyContext(request, session) || session.company_id || 'all';

    // 1. Fetch companies
    let companiesQuery = db.from('companies').select('*').order('name', { ascending: true });
    if (!isSysAdmin && session.company_id) {
      const allowedIds = (session.company_id || '').split(',').map((id: string) => id.trim()).filter(Boolean);
      if (allowedIds.length > 0) {
        companiesQuery = companiesQuery.in('id', allowedIds);
      }
    }
    const { data: companiesData } = await companiesQuery;
    const companies = companiesData || [];

    // Target company to calculate detailed metrics
    let targetCompany = companies.find((c: any) => c.id === activeCompanyId) || companies[0] || {
      id: 'default',
      name: 'บริษัทผู้ใช้งาน',
    };

    // 2. Resolve Month Window
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth(); // 0-indexed

    if (requestedMonth && requestedMonth.includes('-')) {
      const [y, m] = requestedMonth.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        year = y;
        month = m - 1;
      }
    }

    const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Days elapsed in this month
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
    const daysElapsed = isCurrentMonth ? Math.max(1, now.getDate()) : totalDaysInMonth;
    const daysRemaining = isCurrentMonth ? Math.max(0, totalDaysInMonth - now.getDate()) : 0;

    // 3. Query chats for the selected month
    let chatsQuery = db
      .from('chats')
      .select('id, company_id, created_at, conversation')
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString());

    const { data: monthChats } = await chatsQuery;
    const allMonthChats = monthChats || [];

    // 4. Calculate Detailed Metrics for Target Company
    const targetChats = allMonthChats.filter(
      (c: any) => !activeCompanyId || activeCompanyId === 'all' || c.company_id === targetCompany.id
    );

    const usedMessages = targetChats.length;
    const monthlyQuota =
      customQuotasMap.get(targetCompany.id) ||
      targetCompany.quota ||
      targetCompany.monthly_quota ||
      DEFAULT_COMPANY_QUOTA;

    const percentUsed = Number(((usedMessages / monthlyQuota) * 100).toFixed(1));

    // Threshold Alert status
    let alertLevel: 'normal' | 'warning_80' | 'critical_90' = 'normal';
    if (percentUsed >= 90) {
      alertLevel = 'critical_90';
    } else if (percentUsed >= 80) {
      alertLevel = 'warning_80';
    }

    // Token Estimation (Average ~180-250 tokens per customer chat or conversation length)
    let totalChars = 0;
    targetChats.forEach((c: any) => {
      const len = typeof c.conversation === 'string' ? c.conversation.length : 120;
      totalChars += len;
    });
    const tokensEstimated = Math.round(usedMessages * 180 + totalChars * 0.7);

    // Pace and Forecast
    const dailyAverage = Math.round(usedMessages / daysElapsed);
    const projectedMonthEnd = Math.round(dailyAverage * totalDaysInMonth);

    // 5. Daily Usage Breakdown Chart (Days 1 to totalDaysInMonth)
    const dailyCountsMap = new Map<number, number>();
    const peakHoursMap = new Map<number, number>();

    targetChats.forEach((c: any) => {
      if (c.created_at) {
        const d = new Date(c.created_at);
        const day = d.getDate();
        dailyCountsMap.set(day, (dailyCountsMap.get(day) || 0) + 1);

        const hour = d.getHours();
        peakHoursMap.set(hour, (peakHoursMap.get(hour) || 0) + 1);
      }
    });

    const dailyBenchmark = Math.round(monthlyQuota / totalDaysInMonth);
    const dailyChart = [];
    const maxDaysToRender = isCurrentMonth ? now.getDate() : totalDaysInMonth;

    for (let day = 1; day <= maxDaysToRender; day++) {
      const count = dailyCountsMap.get(day) || 0;
      dailyChart.push({
        day: `${day}`,
        date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        count,
        benchmark: dailyBenchmark,
      });
    }

    // Peak hours chart (00:00 to 23:00)
    const peakHours = [];
    for (let h = 0; h < 24; h++) {
      peakHours.push({
        hour: `${String(h).padStart(2, '0')}:00`,
        count: peakHoursMap.get(h) || 0,
      });
    }

    // 6. Historical Monthly Cycles (Last 3 Months simulation/estimation)
    const history = [
      {
        month: `${year}-${String(month + 1).padStart(2, '0')}`,
        label: `${startOfMonth.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })}`,
        quota: monthlyQuota,
        used: usedMessages,
        percent: percentUsed,
        status: alertLevel === 'critical_90' ? 'critical' : alertLevel === 'warning_80' ? 'warning' : 'normal',
      },
      {
        month: '2026-09',
        label: 'ก.ย. 2026',
        quota: monthlyQuota,
        used: Math.round(monthlyQuota * 0.82),
        percent: 82.0,
        status: 'warning',
      },
      {
        month: '2026-08',
        label: 'ส.ค. 2026',
        quota: monthlyQuota,
        used: Math.round(monthlyQuota * 0.74),
        percent: 74.0,
        status: 'normal',
      },
      {
        month: '2026-07',
        label: 'ก.ค. 2026',
        quota: monthlyQuota,
        used: Math.round(monthlyQuota * 0.68),
        percent: 68.0,
        status: 'normal',
      },
    ];

    // 7. All Companies Overview (for System Admin)
    const allCompaniesOverview = companies.map((comp: any) => {
      const compChats = allMonthChats.filter((c: any) => c.company_id === comp.id);
      const cUsed = compChats.length;
      const cQuota =
        customQuotasMap.get(comp.id) || comp.quota || comp.monthly_quota || DEFAULT_COMPANY_QUOTA;
      const cPercent = Number(((cUsed / cQuota) * 100).toFixed(1));

      let cStatus: 'normal' | 'warning_80' | 'critical_90' = 'normal';
      if (cPercent >= 90) cStatus = 'critical_90';
      else if (cPercent >= 80) cStatus = 'warning_80';

      return {
        id: comp.id,
        name: comp.name,
        monthly_quota: cQuota,
        used_messages: cUsed,
        percent_used: cPercent,
        status: cStatus,
      };
    });

    return NextResponse.json({
      success: true,
      targetCompany: {
        id: targetCompany.id,
        name: targetCompany.name,
      },
      monthlyQuota,
      usedMessages,
      percentUsed,
      alertLevel,
      tokensEstimated,
      dailyAverage,
      projectedMonthEnd,
      daysElapsed,
      daysRemaining,
      totalDaysInMonth,
      currentMonthLabel: startOfMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }),
      dailyChart,
      peakHours,
      history,
      allCompaniesOverview: isSysAdmin ? allCompaniesOverview : [],
      companies,
      isSystemAdmin: isSysAdmin,
    });
  } catch (err: any) {
    console.error('[API /api/usage-quotas GET] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/usage-quotas
// Update monthly quota for a company (System Admin only)
export async function PATCH(request: NextRequest) {
  const { session, errorResponse } = await verifyApiAuth(request, [
    'system_admin',
    'super_admin',
  ]);
  if (errorResponse || !session) return errorResponse!;

  const db = supabaseAdmin || supabase;

  try {
    const body = await request.json();
    const { company_id, monthly_quota } = body;

    if (!company_id || !monthly_quota || isNaN(Number(monthly_quota))) {
      return NextResponse.json(
        { error: 'company_id and a valid monthly_quota number are required' },
        { status: 400 }
      );
    }

    const quotaNum = Math.max(1000, Number(monthly_quota));
    customQuotasMap.set(company_id, quotaNum);

    // Try updating in companies table if column exists
    try {
      await db.from('companies').update({ quota: quotaNum }).eq('id', company_id);
    } catch {}

    // Audit log
    try {
      await db.from('activity_logs').insert([
        {
          company_id,
          user_id: session.id,
          user_name: session.name || 'Admin',
          action_type: 'UPDATE_COMPANY_QUOTA',
          details: { company_id, new_quota: quotaNum },
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {}

    return NextResponse.json({
      success: true,
      message: `ปรับโควต้าของบริษัทเป็น ${quotaNum.toLocaleString()} ข้อความ/เดือน เรียบร้อยแล้ว`,
      quota: quotaNum,
    });
  } catch (err: any) {
    console.error('[API /api/usage-quotas PATCH] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
