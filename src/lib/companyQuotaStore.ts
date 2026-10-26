import { supabase, supabaseAdmin } from '@/lib/supabase';

export const DEFAULT_COMPANY_QUOTA = 50000;

// Shared in-memory cache for fast access within the same instance
const customQuotasMap = new Map<string, number>();
let lastHydratedAt = 0;
const HYDRATE_TTL_MS = 30000; // 30s

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
    const { data: logs } = await db
      .from('activity_logs')
      .select('company_id, action_type, details, created_at')
      .in('action_type', ['UPDATE_COMPANY_QUOTA', 'CREATE_COMPANY_ONBOARDING'])
      .order('created_at', { ascending: true })
      .limit(200);

    if (Array.isArray(logs)) {
      logs.forEach((log: any) => {
        const cid = log.company_id || log.details?.company_id;
        const q = log.details?.new_quota ?? log.details?.monthly_quota;
        if (cid && q !== undefined && !isNaN(Number(q))) {
          customQuotasMap.set(cid, Number(q));
        }
      });
    }
    lastHydratedAt = now;
  } catch {
    // Ignore errors if activity_logs isn't reachable
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
