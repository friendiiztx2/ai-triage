import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sanitizeText } from '@/lib/sanitize';
import crypto from 'crypto';

const INITIAL_CATEGORY = {
  key: 'device_compatibility',
  name: 'ปัญหาบราวเซอร์/อุปกรณ์',
  name_en: 'Device Compatibility',
  description: 'ใช้งานบนมือถือไม่ได้, Safari มีปัญหา, Chrome แสดงผลผิด, Firefox ใช้งานไม่ได้, Tablet แสดงผลผิด, ระบบไม่รองรับอุปกรณ์'
};


async function verifySystemAdmin(request: NextRequest): Promise<boolean> {
  const email = request.headers.get('x-user-email') || request.cookies.get('user_email')?.value;
  const password = request.headers.get('x-user-password') || request.cookies.get('user_password')?.value;

  if (!email || !password) {
    const sessionCookie = request.cookies.get('user_session')?.value;
    if (sessionCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(sessionCookie));
        return parsed.role === 'system_admin';
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('role')
    .eq('email', email.trim().toLowerCase())
    .eq('password', password.trim())
    .maybeSingle();

  if (error || !user) return false;
  return user.role === 'system_admin';
}

export async function POST(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for sequential queries

  try {
    const isAuthorized = await verifySystemAdmin(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'ปฏิเสธการเข้าถึง (สิทธิ์เฉพาะ System Admin)' }, { status: 403 });
    }

    const { name, domain } = await request.json();

    if (!name || !domain) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อบริษัท, โดเมน)' }, { status: 450 });
    }

    const newCompanyId = crypto.randomUUID();
    const clientId = `cli_${crypto.randomBytes(8).toString('hex')}`;
    const clientSecret = `sec_${crypto.randomBytes(16).toString('hex')}`;

    const newCompany = {
      id: newCompanyId,
      name: sanitizeText(name),
      domain: sanitizeText(domain).toLowerCase(),
      client_id: clientId,
      client_secret: clientSecret,
      created_at: new Date().toISOString()
    };

    // 1. Insert the new company
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert([newCompany])
      .select()
      .abortSignal(controller.signal);

    if (companyError) throw companyError;

    // 2. Initialize the single default category for this company
    const initialCategoryRecord = {
      id: `${newCompanyId}:${INITIAL_CATEGORY.key}`,
      name: INITIAL_CATEGORY.name,
      name_en: INITIAL_CATEGORY.name_en,
      description: INITIAL_CATEGORY.description,
      company_id: newCompanyId
    };

    const { error: catInsertError } = await supabase
      .from('categories')
      .insert([initialCategoryRecord])
      .abortSignal(controller.signal);

    if (catInsertError) {
      console.warn('Could not insert default category for new company:', catInsertError);
    }

    clearTimeout(timeoutId);
    return NextResponse.json(companyData?.[0] || { success: true });
  } catch (err: any) {
    clearTimeout(timeoutId);
    const errMsg = err.name === 'AbortError' ? 'Supabase connection timed out (10s)' : err.message;
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
