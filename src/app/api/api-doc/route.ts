import { NextRequest, NextResponse } from 'next/server';
import { verifyApiAuth, PRIVATE_NO_STORE } from '@/lib/auth';
import { INGEST_API_DOC_TEMPLATE, INGEST_API_DOC_VERSION } from '@/lib/apiDocs/ingestApiDoc';
import { INGEST_API_DOC_MARKDOWN, markdownToPlainText } from '@/lib/apiDocs/ingestApiDocMarkdown';

/**
 * Download the Chat Ingest API guide (one generic file, no company data).
 * system_admin only, the role that manages companies and their API keys.
 */
export async function GET(request: NextRequest) {
  const { session, errorResponse } = await verifyApiAuth(request, ['system_admin']);
  if (errorResponse || !session) return errorResponse!;
  // verifyApiAuth always lets super_admin through, so check the role exactly here
  if (session.role !== 'system_admin') {
    return NextResponse.json(
      { error: 'Forbidden: ดาวน์โหลดเอกสาร API ได้เฉพาะ System Admin' },
      { status: 403 }
    );
  }

  // ?format=html (default) | md | txt
  const format = request.nextUrl.searchParams.get('format') || 'html';
  const files: Record<string, { body: string; type: string }> = {
    html: { body: INGEST_API_DOC_TEMPLATE, type: 'text/html' },
    md: { body: INGEST_API_DOC_MARKDOWN, type: 'text/markdown' },
    txt: { body: markdownToPlainText(INGEST_API_DOC_MARKDOWN), type: 'text/plain' },
  };
  const file = files[format];
  if (!file) {
    return NextResponse.json({ error: 'format ต้องเป็น html, md หรือ txt' }, { status: 400 });
  }

  return new NextResponse(file.body, {
    headers: {
      ...PRIVATE_NO_STORE,
      'Content-Type': `${file.type}; charset=utf-8`,
      'Content-Disposition': `attachment; filename="sift-ai-ingest-api_${INGEST_API_DOC_VERSION}.${format}"`,
    },
  });
}
