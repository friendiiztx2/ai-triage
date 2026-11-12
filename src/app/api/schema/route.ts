import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyApiAuth } from '@/lib/auth';

// SECURITY: only these tables may be inspected (matches the /schema page tabs).
// Never allow arbitrary table names — this route runs with the service-role key.
const ALLOWED_TABLES = new Set(['chats', 'customers', 'categories']);

// Defensive redaction in case a sensitive column is ever added to an allowed table
const SENSITIVE_KEYS = new Set(['password', 'client_secret', 'token', 'api_key', 'secret']);

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await verifyApiAuth(request, ['system_admin']);
  if (errorResponse || !session) return errorResponse!;

  const { searchParams } = new URL(request.url);
  const tableName = searchParams.get('table') || 'chats';

  if (!ALLOWED_TABLES.has(tableName)) {
    return NextResponse.json({ error: 'Table not allowed' }, { status: 400 });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);
    if (error) throw error;

    const row = data && data.length > 0 ? { ...data[0] } : null;
    if (row) {
      for (const key of Object.keys(row)) {
        if (SENSITIVE_KEYS.has(key.toLowerCase())) row[key] = '[redacted]';
      }
    }
    return NextResponse.json(row);
  } catch (err: any) {
    clearTimeout(timeoutId);
    const errMsg = err.name === 'AbortError' ? 'Supabase connection timed out (30s)' : err.message;
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
