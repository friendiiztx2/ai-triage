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

  try {
    let query = db
      .from('companies')
      .select('id, name, domain, client_id, client_secret, created_at')
      .order('created_at', { ascending: false });

    // Multi-tenant Isolation: non-system_admin users only see their own assigned companies
    if (session.role !== 'system_admin' && session.role !== 'super_admin') {
      const allowedIds = (session.company_id || '').split(',').map((id: string) => id.trim()).filter(Boolean);
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

    const dbList = !error && Array.isArray(companies) ? companies : [];
    const fallbackList = getFallbackCompanies();

    // Merge fallback companies (if Supabase is restricted by egress quota)
    const mergedMap = new Map<string, any>();
    fallbackList.forEach((c) => mergedMap.set(c.id, c));
    dbList.forEach((c) => mergedMap.set(c.id, c));

    const merged = Array.from(mergedMap.values());

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
    return NextResponse.json(getFallbackCompanies());
  }
}
