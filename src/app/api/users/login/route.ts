import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const db = supabaseAdmin || supabase;
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อบัญชีและรหัสผ่าน' }, { status: 400 });
    }

    const inputVal = email.trim();
    const passVal = password.trim();

    // Query users table matching email or name (case-insensitive) and password using admin bypass
    const { data: dbUsers, error } = await db
      .from('users')
      .select('*')
      .or(`email.ilike.${inputVal},name.ilike.${inputVal}`)
      .eq('password', passVal)
      .limit(1);

    if (error) {
      console.error('Login DB query error:', error);
      return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบบัญชี' }, { status: 500 });
    }

    const dbUser = dbUsers?.[0];

    if (dbUser) {
      if (dbUser.is_active === false) {
        return NextResponse.json({ error: 'บัญชีผู้ใช้นี้ถูกระงับการใช้งาน' }, { status: 403 });
      }
      return NextResponse.json({ user: dbUser });
    }

    return NextResponse.json({ error: 'ชื่อบัญชีหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
