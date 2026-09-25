import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { KNOWN_CATEGORY_NAMES, getBaseCatId } from '@/lib/categories';

export async function GET(request: NextRequest) {
  const db = supabaseAdmin || supabase;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const { searchParams } = new URL(request.url);
    const filterCompanyId = searchParams.get('company_id');

    // 1. Fetch categories
    let catQuery = db.from('categories').select('id, name, description, company_id, name_en');
    if (filterCompanyId && filterCompanyId !== 'all') {
      catQuery = catQuery.eq('company_id', filterCompanyId);
    }
    const { data: catData, error: catError } = await catQuery.abortSignal(controller.signal);

    // 2. Fetch issue counts
    let issueQuery = db.from('chat_issues').select('category_id');
    if (filterCompanyId && filterCompanyId !== 'all') {
      issueQuery = issueQuery.eq('company_id', filterCompanyId);
    }
    const { data: issueData } = await issueQuery.abortSignal(controller.signal);

    clearTimeout(timeoutId);

    // Count by base category
    const countMap: Record<string, number> = {};
    if (issueData) {
      issueData.forEach((issue: any) => {
        const baseKey = getBaseCatId(issue.category_id || 'other');
        countMap[baseKey] = (countMap[baseKey] || 0) + 1;
      });
    }

    const categoriesList = catData || [];
    const categoryMap = new Map<string, any>();

    categoriesList.forEach((item: any) => {
      const baseKey = getBaseCatId(item.id);
      const known = KNOWN_CATEGORY_NAMES[baseKey];
      const match = typeof item.name === 'string' ? item.name.match(/^(.+?)\s*\(([^)]+)\)$/) : null;

      const cleanTh = item.name_th || (match ? match[1].trim() : item.name) || known?.th || item.name;
      const cleanEn = item.name_en || (match ? match[2].trim() : known?.en) || item.name;

      const enriched = {
        id: item.id,
        base_id: baseKey,
        name: cleanTh,
        name_th: cleanTh,
        name_en: cleanEn,
        description: item.description,
        company_id: item.company_id,
        count: countMap[baseKey] || 0
      };

      if (!categoryMap.has(baseKey)) {
        categoryMap.set(baseKey, enriched);
      }
    });

    const uniqueCategories = Array.from(categoryMap.values());

    return NextResponse.json(uniqueCategories, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
      }
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    return NextResponse.json({ error: err.message || 'Failed to fetch categories stats' }, { status: 500 });
  }
}
