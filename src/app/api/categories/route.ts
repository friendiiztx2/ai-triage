import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';

const defaultCategories = [
  { id: 'login_issue', name: 'ปัญหาระบบเข้าใช้งาน/ล็อกอิน (Login Issue)', description: 'ลืมรหัสผ่าน, ไม่ได้รับ OTP, บัญชีถูกล็อก', company_id: '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2' },
  { id: 'ui_rendering_issue', name: 'ปัญหากราฟิก/การแสดงผลเว็บ (UI Rendering Issue)', description: 'ภาพไม่โหลด, ปุ่มกดไม่ได้, หน้าจอกราฟิกค้าง', company_id: '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2' },
  { id: 'deposit_withdrawal', name: 'การฝาก-ถอนเงิน (Deposit & Withdrawal)', description: 'โอนเงินแล้วยอดไม่ปรับ, รอนานเกินเวลา, สลิปไม่ตรง', company_id: '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2' },
  { id: 'promo_bonus', name: 'สิทธิประโยชน์ระดับ VIP / โปรโมชั่น (Promo & Bonus)', description: 'ขอรับโบนัสฟรี, สอบถามยอดคืนยอดเสีย, โปรโมชั่น', company_id: '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2' },
  { id: 'account_security', name: 'ความปลอดภัยบัญชี (Account Security)', description: 'ขอเปลี่ยนเบอร์โทรศัพท์, ตรวจสอบการเข้าถึง', company_id: '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2' },
  { id: 'access_blocked', name: 'การเข้าถึงถูกระงับ (Access Blocked / Error 502)', description: 'เข้าหน้าเว็บไม่ได้, ขึ้น 502 Bad Gateway', company_id: '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2' },
  { id: 'game_issue', name: 'ปัญหาเกี่ยวกับตัวเกม (Game Issue)', description: 'เกมค้าง, หลุดกลางคัน, API timeout', company_id: '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2' },
  { id: 'interaction_lag', name: 'ระบบการทำงานล่าช้า (System Lag)', description: 'การตอบสนองช้า, ปุ่มกดไม่ติด', company_id: '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2' },
  { id: 'vip_privilege', name: 'สิทธิประโยชน์ระดับ VIP (VIP Privileges)', description: 'บริการสมาชิกพิเศษ VIP', company_id: '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2' },
  { id: 'other', name: 'เรื่องอื่นๆ (Other Inquiries)', description: 'สอบถามข้อมูลทั่วไป', company_id: '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2' }
];

export async function GET(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  const db = supabaseAdmin || supabase;

  try {
    const { data, error } = await db
      .from('categories')
      .select('*')
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);
    if (error || !data || data.length === 0) {
      return NextResponse.json(defaultCategories);
    }
    return NextResponse.json(data);
  } catch (err: any) {
    clearTimeout(timeoutId);
    return NextResponse.json(defaultCategories);
  }
}

export async function POST(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const companyId = request.headers.get('x-company-id') || request.cookies.get('company_id')?.value;

  try {
    const { id, name, description } = await request.json();

    if (!id || !name) {
      return NextResponse.json({ error: 'โปรดระบุไอดีและชื่อหมวดหมู่' }, { status: 400 });
    }

    const insertData: any = { id, name, description };
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const { id, name, description } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'โปรดระบุไอดีหมวดหมู่ที่ต้องการแก้ไข' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('categories')
      .update({ name, description })
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
