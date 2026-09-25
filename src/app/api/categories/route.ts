import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { KNOWN_CATEGORY_NAMES, getBaseCatId, getCategoryLabel } from '@/lib/categories';

const defaultCategories = [
  { id: 'login_issue', name: 'ปัญหาระบบเข้าใช้งาน/ล็อกอิน', name_th: 'ปัญหาระบบเข้าใช้งาน/ล็อกอิน', name_en: 'Login Issue', description: 'ลืมรหัสผ่าน, ไม่ได้รับ OTP, บัญชีถูกล็อก', company_id: '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2' },
  { id: 'ui_rendering_issue', name: 'ปัญหากราฟิก/การแสดงผลเว็บ', name_th: 'ปัญหากราฟิก/การแสดงผลเว็บ', name_en: 'UI Rendering Issue', description: 'ภาพไม่โหลด, ปุ่มกดไม่ได้, หน้าจอกราฟิกค้าง', company_id: '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2' },
  { id: 'deposit_withdrawal', name: 'การเงินและการชำระเงิน', name_th: 'การเงินและการชำระเงิน', name_en: 'Deposit & Withdrawal', description: 'โอนเงินแล้วยอดไม่ปรับ, รอนานเกินเวลา, สลิปไม่ตรง', company_id: '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2' },
  { id: 'promo_bonus', name: 'โปรโมชั่นและโบนัส', name_th: 'โปรโมชั่นและโบนัส', name_en: 'Promo & Bonus', description: 'ขอรับโบนัสฟรี, สอบถามยอดคืนยอดเสีย, โปรโมชั่น', company_id: '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2' },
  { id: 'account_security', name: 'ความปลอดภัยของบัญชี', name_th: 'ความปลอดภัยของบัญชี', name_en: 'Account Security', description: 'ขอเปลี่ยนเบอร์โทรศัพท์, ตรวจสอบการเข้าถึง', company_id: '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2' },
  { id: 'access_blocked', name: 'เข้าหน้าเว็บไม่ได้/ลิงก์เสีย', name_th: 'เข้าหน้าเว็บไม่ได้/ลิงก์เสีย', name_en: 'Access Blocked', description: 'เข้าหน้าเว็บไม่ได้, ขึ้น 502 Bad Gateway', company_id: '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2' },
  { id: 'game_issue', name: 'ปัญหาเกี่ยวกับตัวเกม', name_th: 'ปัญหาเกี่ยวกับตัวเกม', name_en: 'Game Issue', description: 'เกมค้าง, หลุดกลางคัน, API timeout', company_id: '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2' },
  { id: 'interaction_lag', name: 'ระบบการทำงานล่าช้า', name_th: 'ระบบการทำงานล่าช้า', name_en: 'System Lag', description: 'การตอบสนองช้า, ปุ่มกดไม่ติด', company_id: '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2' },
  { id: 'vip_privilege', name: 'สิทธิประโยชน์ระดับ VIP', name_th: 'สิทธิประโยชน์ระดับ VIP', name_en: 'VIP Privileges', description: 'บริการสมาชิกพิเศษ VIP', company_id: '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2' },
  { id: 'other', name: 'เรื่องอื่นๆ', name_th: 'เรื่องอื่นๆ', name_en: 'Other Inquiries', description: 'สอบถามข้อมูลทั่วไป', company_id: '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2' }
];

interface CacheEntry {
  timestamp: number;
  data: any;
}
const serverCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60000; // 60 Seconds TTL for categories

export async function GET(request: NextRequest) {
  const cacheKey = request.url;
  const now = Date.now();
  const cached = serverCache.get(cacheKey);

  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return NextResponse.json(cached.data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'X-Cache': 'HIT'
      }
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  const db = supabaseAdmin || supabase;

  try {
    const { searchParams } = new URL(request.url);
    const filterCompanyId = searchParams.get('company_id');

    let query = db.from('categories').select('id, name, description, company_id, name_en');
    if (filterCompanyId && filterCompanyId !== 'all') {
      query = query.eq('company_id', filterCompanyId);
    }

    const { data, error } = await query.abortSignal(controller.signal);

    clearTimeout(timeoutId);
    const list = (!error && data && data.length > 0) ? data : defaultCategories;

    // Deduplicate by base category key and enrich fields
    const categoryMap = new Map<string, any>();
    list.forEach((item: any) => {
      const baseKey = getBaseCatId(item.id);
      const known = KNOWN_CATEGORY_NAMES[baseKey];
      const match = typeof item.name === 'string' ? item.name.match(/^(.+?)\s*\(([^)]+)\)$/) : null;

      const cleanTh = item.name_th || (match ? match[1].trim() : item.name) || known?.th || item.name;
      const cleanEn = item.name_en || (match ? match[2].trim() : known?.en) || item.name;

      const enriched = {
        ...item,
        name: cleanTh,
        name_th: cleanTh,
        name_en: cleanEn
      };

      if (!categoryMap.has(baseKey)) {
        categoryMap.set(baseKey, enriched);
      }
    });

    const uniqueCategories = Array.from(categoryMap.values());
    serverCache.set(cacheKey, { timestamp: now, data: uniqueCategories });

    return NextResponse.json(uniqueCategories, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    return NextResponse.json(defaultCategories);
  }
}

export async function POST(request: NextRequest) {
  serverCache.clear();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const companyId = request.headers.get('x-company-id') || request.cookies.get('company_id')?.value;

  try {
    const { id, name, description, name_en, name_th } = await request.json();

    if (!id || (!name && !name_th)) {
      return NextResponse.json({ error: 'โปรดระบุไอดีและชื่อหมวดหมู่' }, { status: 400 });
    }

    const baseKey = getBaseCatId(id);
    const finalTh = name_th || name;
    const finalEn = name_en || KNOWN_CATEGORY_NAMES[baseKey]?.en || getCategoryLabel(finalTh, 'en');

    const insertData: any = {
      id,
      name: finalTh,
      name_en: finalEn,
      description
    };
    if (companyId) {
      insertData.company_id = companyId;
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([insertData])
      .select()
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);
    if (error) throw error;

    return NextResponse.json(data?.[0] || { success: true });
  } catch (err: any) {
    clearTimeout(timeoutId);
    const errMsg = err.name === 'AbortError' ? 'Supabase connection timed out (30s)' : err.message;
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  serverCache.clear();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const { id, name, description, name_en, name_th } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'โปรดระบุไอดีหมวดหมู่ที่ต้องการแก้ไข' }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined || name_th !== undefined) {
      updateData.name = name_th || name;
    }
    if (name_en !== undefined) {
      updateData.name_en = name_en;
    }
    if (description !== undefined) {
      updateData.description = description;
    }

    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);
    if (error) throw error;

    return NextResponse.json(data?.[0] || { success: true });
  } catch (err: any) {
    clearTimeout(timeoutId);
    const errMsg = err.name === 'AbortError' ? 'Supabase connection timed out (30s)' : err.message;
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  serverCache.clear();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'โปรดระบุไอดีหมวดหมู่ที่ต้องการลบ' }, { status: 400 });
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);
    if (error) {
      // 23503 is PostgreSQL code for foreign key violation
      if (error.code === '23503') {
        return NextResponse.json({ 
          error: 'ไม่สามารถลบหมวดหมู่นี้ได้ เนื่องจากมีแชตลูกค้าใช้งานอยู่ในหัวข้อนี้ โปรดไปแก้ไขแชตในหน้ารายการแชตให้เปลี่ยนเป็นหมวดหมู่อื่นก่อนทำการลบ' 
        }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    clearTimeout(timeoutId);
    const errMsg = err.name === 'AbortError' ? 'Supabase connection timed out (30s)' : err.message;
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
