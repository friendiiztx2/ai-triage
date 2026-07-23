import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const companyId = request.headers.get('x-company-id') || request.cookies.get('company_id')?.value;

  try {
    let query = supabase.from('categories').select('*');
    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query.abortSignal(controller.signal);

    clearTimeout(timeoutId);
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    clearTimeout(timeoutId);
    const errMsg = err.name === 'AbortError' ? 'Supabase connection timed out (30s)' : err.message;
    return NextResponse.json({ error: errMsg }, { status: 500 });
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
