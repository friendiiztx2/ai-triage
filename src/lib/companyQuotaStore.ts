import { supabase, supabaseAdmin } from '@/lib/supabase';

export const DEFAULT_COMPANY_QUOTA = 50000;

/**
 * Action types whose activity_logs rows define a company's quota.
 * Only trusted server routes (usage-quotas PATCH, companies/register) may write these;
 * /api/audit-logs refuses them so users can't forge their own quota.
 */
export const QUOTA_ACTION_TYPES = ['UPDATE_COMPANY_QUOTA', 'CREATE_COMPANY_ONBOARDING'] as const;

// Shared in-memory cache for fast access within the same server instance
const customQuotasMap = new Map<string, number>();

let lastHydratedAt = 0;
const HYDRATE_TTL_MS = 30000; // 30s
const HYDRATE_PAGE_SIZE = 1000;
const HYDRATE_MAX_PAGES = 20; // up to 20,000 quota events

export function getPackageInfoFromQuota(quota: number): {
  id: 'starter' | 'pro' | 'enterprise' | 'custom';
  name: string;
  badgeText: string;
  priceText: string;
  quota: number;
  isUnlimited: boolean;
} {
  if (quota === -1 || quota >= 999999999) {
    return {
      id: 'custom',
      name: 'Custom',
      badgeText: 'Custom (ไม่จำกัด)',
      priceText: 'ตามตกลง',
      quota: -1,
      isUnlimited: true,
    };
  }
  if (quota <= 20000) {
    return {
      id: 'starter',
      name: 'Starter',
      badgeText: 'Starter (20,000)',
      priceText: '฿8,000/ด.',
      quota: 20000,
      isUnlimited: false,
    };
  }
  if (quota <= 50000) {
    return {
      id: 'pro',
      name: 'Pro',
      badgeText: 'Pro (50,000)',
      priceText: '฿15,000/ด.',
      quota: 50000,
      isUnlimited: false,
    };
  }
  if (quota <= 120000) {
    return {
      id: 'enterprise',
      name: 'Enterprise',
      badgeText: 'Enterprise (120,000)',
      priceText: '฿28,000/ด.',
      quota: 120000,
      isUnlimited: false,
    };
  }
  return {
    id: 'custom',
    name: 'Custom',
    badgeText: `Custom (${quota.toLocaleString()})`,
    priceText: 'ตามตกลง',
    quota,
    isUnlimited: false,
  };
}

export function setCompanyQuotaInMemory(companyId: string, quota: number) {
  customQuotasMap.set(companyId, quota);
}

export async function hydrateCompanyQuotas(): Promise<Map<string, number>> {
  const now = Date.now();
  if (now - lastHydratedAt < HYDRATE_TTL_MS && customQuotasMap.size > 0) {
    return customQuotasMap;
  }

  const db = supabaseAdmin || supabase;
  try {
    // FIX: read NEWEST first and keep only the first (latest) value per company.
    // Previously this read the OLDEST 200 rows, so once there were more than 200 quota
    // events, later quota changes were silently ignored.
    const latest = new Map<string, number>();
    for (let page = 0; page < HYDRATE_MAX_PAGES; page++) {
      const from = page * HYDRATE_PAGE_SIZE;
      const { data: logs, error } = await db
        .from('activity_logs')
        .select('company_id, action_type, details, created_at')
        .in('action_type', QUOTA_ACTION_TYPES as unknown as string[])
        .order('created_at', { ascending: false })
        .range(from, from + HYDRATE_PAGE_SIZE - 1);

      if (error || !Array.isArray(logs)) break;

      for (const log of logs as any[]) {
        const cid = log.company_id || log.details?.company_id;
        const q = log.details?.new_quota ?? log.details?.monthly_quota;
        if (cid && !latest.has(cid) && q !== undefined && !isNaN(Number(q))) {
          latest.set(cid, Number(q));
        }
      }
      if (logs.length < HYDRATE_PAGE_SIZE) break;
    }

    latest.forEach((q, cid) => customQuotasMap.set(cid, q));
    lastHydratedAt = now;
  } catch {
    // Ignore errors if activity_logs isn't reachable; keep the cached values
  }

  return customQuotasMap;
}

export function resolveCompanyQuota(company: any, quotaMap?: Map<string, number>): number {
  const mapToUse = quotaMap || customQuotasMap;
  const raw =
    mapToUse.get(company?.id) ??
    company?.quota ??
    company?.monthly_quota ??
    DEFAULT_COMPANY_QUOTA;
  return Number(raw);
}
