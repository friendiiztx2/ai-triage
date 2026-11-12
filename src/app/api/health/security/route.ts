import { NextRequest, NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/auth';
import { supabaseKeyRole, isUsingPrivilegedKey } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health/security — system_admin only.
 * Reports security-relevant configuration WITHOUT revealing any secret values,
 * so the team can confirm the server is ready before tightening Supabase RLS policies.
 */
export async function GET(request: NextRequest) {
  const { session, errorResponse } = await verifyApiAuth(request, ['system_admin']);
  if (errorResponse || !session) return errorResponse!;

  const sessionSecret = process.env.SESSION_SECRET?.trim() || '';

  return NextResponse.json(
    {
      supabase_key_role: supabaseKeyRole,
      supabase_key_ok_for_strict_rls: isUsingPrivilegedKey,
      supabase_url_from_env: Boolean(process.env.SUPABASE_URL),
      session_secret_configured: sessionSecret.length >= 32,
      environment: process.env.NODE_ENV,
    },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
