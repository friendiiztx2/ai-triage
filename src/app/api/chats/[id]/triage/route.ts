import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing chat id' }, { status: 400 });
  }

  const backendUrl = process.env.TRIAGE_BACKEND_URL || 'http://localhost:4000';
  const targetUrl = `${backendUrl}/api/chats/${id}/triage`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for LLM

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error('Error forwarding triage request:', err);
    const isConnectionRefused = err?.cause?.code === 'ECONNREFUSED' || err?.message?.includes('fetch failed');
    return NextResponse.json({
      error: isConnectionRefused
        ? `ไม่สามารถเชื่อมต่อ AI Triage Backend ที่ ${backendUrl} ได้ (กรุณาตรวจสอบว่า Service ทำงานอยู่ที่พอร์ต 4000)`
        : (err.message || 'เกิดข้อผิดพลาดในการประมวลผล AI Triage')
    }, { status: 502 });
  }
}
