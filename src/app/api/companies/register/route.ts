import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sanitizeText } from '@/lib/sanitize';
import crypto from 'crypto';

const DEFAULT_CATEGORIES = [
  { id: 'device_compatibility', name: 'ปัญหาบราวเซอร์/อุปกรณ์', description: 'ใช้งานบนมือถือไม่ได้, Safari มีปัญหา, Chrome แสดงผลผิด, Firefox ใช้งานไม่ได้, Tablet แสดงผลผิด, ระบบไม่รองรับอุปกรณ์' },
  { id: 'interaction_lag', name: 'กดปุ่มแล้วไม่ตอบสนอง', description: 'ปุ่มกดไม่ตอบสนอง, คลิกแล้วไม่มีอะไรเกิดขึ้น, ฟอร์มส่งไม่ได้, Popup ไม่เปิด, เมนูใช้งานไม่ได้' },
  { id: 'ui_rendering_issue', name: 'การแสดงผลผิดเพี้ยน', description: 'ตัวหนังสือซ้อนกัน, ปุ่มหาย, รูปภาพไม่ขึ้น, Layout เพี้ยน, สีผิดปกติ, Responsive ผิด' },
  { id: 'game_issue', name: 'ปัญหาการเล่นเกม', description: 'เข้าเกมไม่ได้, เกมค้าง, เกมเด้ง, ผลเกมผิด, เครดิตไม่อัปเดต, โบนัสไม่เข้า' },
  { id: 'promo_bonus', name: 'โปรโมชั่นและโบนัส', description: 'โบนัสไม่ได้รับ, โปรโมชั่นใช้งานไม่ได้, เทิร์นโอเวอร์ผิด, เครดิตโบนัสผิด, เงื่อนไขโปรโมชั่น' },
  { id: 'other', name: 'ไม่ใช่ปัญหา', description: 'กลุ่มสำหรับแชตทั่วไป สอบถามข้อมูล ขอเลขบัญชี หรือขอรับโบนัสตามปกติที่ไม่ได้เกิดปัญหาขัดข้องใดๆ ของระบบ' },
  { id: 'access_blocked', name: 'เข้าหน้าเว็บไม่ได้/ลิงก์เสีย', description: 'เข้าเว็บไซต์ไม่ได้, Error 403, 404, 502, 503, IP ถูกบล็อก, Cloudflare Block, DNS ผิดพลาด' },
  { id: 'deposit_withdrawal', name: 'ฝาก-ถอน', description: 'ฝากเงินไม่เข้า, ถอนเงินไม่ได้, ถอนเงินล่าช้า, ยอดเงินไม่อัปเดต, สลิปไม่ถูกต้อง, ธนาคารขัดข้อง' },
  { id: 'login_issue', name: 'ปัญหาการเข้าสู่ระบบ', description: 'ลืมรหัสผ่าน, เข้าสู่ระบบไม่ได้, OTP ไม่เข้า, บัญชีถูกล็อก, Session หมดอายุ, ยืนยันตัวตนไม่ผ่าน' },
  { id: 'registration', name: 'การสมัครสมาชิก', description: 'สมัครสมาชิกไม่ได้, ยืนยันเบอร์ไม่ได้, ยืนยันอีเมลไม่ได้, ข้อมูลซ้ำ, รหัสแนะนำไม่ถูกต้อง' },
  { id: 'feedback_complaint', name: 'ข้อเสนอแนะและร้องเรียน', description: 'ข้อเสนอแนะ, แจ้งปัญหาการบริการ, พนักงานบริการไม่ดี, ร้องเรียนระบบ, ขอปรับปรุงบริการ' },
  { id: 'notification_issue', name: 'ปัญหาการแจ้งเตือน', description: 'ไม่ได้รับอีเมล, ไม่ได้รับ SMS, ไม่ได้รับ OTP, ไม่ได้รับแจ้งเตือน, แจ้งเตือนล่าช้า' },
  { id: 'account_security', name: 'ความปลอดภัยของบัญชี', description: 'บัญชีถูกแฮก, เปลี่ยนรหัสผ่าน, เปลี่ยนเบอร์โทร, เปลี่ยนอีเมล, ยืนยันตัวตน' },
  { id: 'payment_gateway', name: 'ระบบการชำระเงิน/ธนาคาร', description: 'QR Code ใช้งานไม่ได้, PromptPay ขัดข้อง, โอนเงินไม่สำเร็จ, Gateway Error, Payment Timeout' },
  { id: 'api_error', name: 'ข้อผิดพลาดระบบ API', description: 'API Error, Server Error, Timeout, Internal Error, Service Unavailable' },
  { id: 'page_load_freeze', name: 'หน้าเว็บค้าง/โหลดช้า', description: 'หน้าเว็บโหลดช้า, หน้าเว็บค้าง, โหลดไม่เสร็จ, หมุนไม่หยุด, เปิดหน้าไม่ได้, ดูไม่ได้, ดูสตรีมไม่ได้, ดูบอลไม่ได้, เล่นสตรีมค้าง' },
  { id: 'performance_issue', name: 'ประสิทธิภาพระบบช้า', description: 'ระบบช้า, CPU สูง, Memory สูง, ระบบหน่วง, ประสิทธิภาพลดลง' },
  { id: 'feature_request', name: 'ขอเพิ่มฟีเจอร์', description: 'ขอเพิ่มฟีเจอร์, ขอปรับปรุงระบบ, ขอเพิ่มเมนู, ขอเพิ่มรายงาน, ขอเพิ่ม API' }
];

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

    // 2. Clone the 18 default categories for this company
    // Query existing categories from Mika Co. if possible, fallback to hardcoded list
    let categoriesToInsert = DEFAULT_CATEGORIES.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      company_id: newCompanyId
    }));

    try {
      const { data: mikaCats, error: fetchCatsError } = await supabase
        .from('categories')
        .select('*')
        .eq('company_id', '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2')
        .abortSignal(controller.signal);

      if (!fetchCatsError && mikaCats && mikaCats.length > 0) {
        categoriesToInsert = mikaCats.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
          company_id: newCompanyId
        }));
      }
    } catch (e) {
      console.warn("Could not query Mika categories, using hardcoded default category list.");
    }

    // 3. Batch insert categories
    const { error: batchInsertError } = await supabase
      .from('categories')
      .insert(categoriesToInsert)
      .abortSignal(controller.signal);

    if (batchInsertError) throw batchInsertError;

    clearTimeout(timeoutId);
    return NextResponse.json(companyData?.[0] || { success: true });
  } catch (err: any) {
    clearTimeout(timeoutId);
    const errMsg = err.name === 'AbortError' ? 'Supabase connection timed out (10s)' : err.message;
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
