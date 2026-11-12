import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { verifyApiAuth } from '@/lib/auth';
import {
  hydrateCompanyQuotas,
  resolveCompanyQuota,
  getPackageInfoFromQuota,
  getFallbackCompanies,
} from '@/lib/companyQuotaStore';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await verifyApiAuth(request);
  if (errorResponse || !session) return errorResponse!;

  const db = supabaseAdmin || supabase;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  // SECURITY: client_secret is only visible to system_admin (the only role that manages companies)
  const canSeeSecrets = session.role === 'system_admin';
  const isGlobalAdmin = session.role === 'system_admin' || session.role === 'super_admin';
  const allowedIds = isGlobalAdmin
    ? []
    : (session.company_id || '').split(',').map((id: string) => id.trim()).filter(Boolean);

  // Applies tenant isolation and secret redaction to any company list (DB or in-memory fallback)
  const sanitizeList = (list: any[]) =>
    list
      .filter((c) => isGlobalAdmin || allowedIds.includes(c?.id))
      .map((c) => {
        if (canSeeSecrets) return c;
        const { client_secret: _secret, ...rest } = c;
        return rest;
      });

  try {
    let query = db
      .from('companies')
      .select(
        canSeeSecrets
          ? 'id, name, domain, client_id, client_secret, created_at'
          : 'id, name, domain, client_id, created_at'
      )
      .order('created_at', { ascending: false });

    // Multi-tenant Isolation: non-system_admin users only see their own assigned companies
    if (!isGlobalAdmin) {
      if (allowedIds.length === 0) {
        clearTimeout(timeoutId);
        return NextResponse.json([]);
      }
      query = query.in('id', allowedIds);
    }

    const [{ data: companies, error }, quotaMap] = await Promise.all([
      query.abortSignal(controller.signal),
      hydrateCompanyQuotas(),
    ]);

    clearTimeout(timeoutId);

    // (column list is chosen at runtime, so supabase-js can't infer the row type)
    const dbList: any[] = !error && Array.isArray(companies) ? (companies as any[]) : [];
    const fallbackList = getFallbackCompanies();

    // Merge fallback companies (if Supabase is restricted by egress quota)
    const mergedMap = new Map<string, any>();
    fallbackList.forEach((c) => mergedMap.set(c.id, c));
    dbList.forEach((c) => mergedMap.set(c.id, c));

    const merged = sanitizeList(Array.from(mergedMap.values()));

    const enriched = merged.map((comp: any) => {
      const quota = resolveCompanyQuota(comp, quotaMap);
      const pkg = getPackageInfoFromQuota(quota);
      return {
        ...comp,
        monthly_quota: quota,
        package_name: pkg.name,
        package_badge: pkg.badgeText,
        is_unlimited: pkg.isUnlimited,
      };
    });

    return NextResponse.json(enriched);
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error('Error fetching companies:', err);
    return NextResponse.json(sanitizeList(getFallbackCompanies()));
  }
}
