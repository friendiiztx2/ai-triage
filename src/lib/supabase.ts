import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * SERVER-ONLY Supabase client.
 *
 * SECURITY: This module must never be imported by client components ('use client'),
 * otherwise the database key gets bundled into the browser JavaScript. Browser code
 * must go through the authenticated /api/* routes instead.
 */
if (typeof window !== 'undefined') {
  throw new Error(
    '[Security] @/lib/supabase is server-only and must not be imported in browser code. Use /api/* routes instead.'
  );
}

const ACTIVE_SUPABASE_URL = 'https://dmorfsududiqtnzrhdvb.supabase.co';

// TODO(security): remove this hard-coded anon key once Vercel is confirmed to have
// SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY for the active project, and the anon key
// has been rotated. It is kept only as a temporary fallback so production keeps working.
const FALLBACK_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtb3Jmc3VkdWRpcXRuenJoZHZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNTg3MTMsImV4cCI6MjEwODczNDcxM30.2P08kFFQoyqeYQlVkMhbV_7mExBFpINTRFqjhLQNhKA';

let supabaseUrl = process.env.SUPABASE_URL || ACTIVE_SUPABASE_URL;
if (supabaseUrl && !supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  supabaseUrl = `https://${supabaseUrl}.supabase.co`;
}

// Automatically switch away from the restricted legacy project if Vercel env vars still hold the old URL
const isLegacyRestrictedProject = supabaseUrl.includes('luhsfxdcnthbxlrxmfvh');
if (isLegacyRestrictedProject) {
  supabaseUrl = ACTIVE_SUPABASE_URL;
}

const rawKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  '';

const supabaseKey =
  !rawKey || isLegacyRestrictedProject || rawKey.includes('bHVoc2Z4ZGNudGhieGxyeG1mdmg')
    ? FALLBACK_ANON_KEY
    : rawKey;

/**
 * Which kind of key the server is using: 'service_role' | 'anon' | 'secret' | 'publishable' | 'unknown'.
 * Server routes must use a service_role / secret key so they keep working once the
 * permissive anon RLS policies are removed.
 */
function detectKeyRole(key: string): string {
  if (key.startsWith('sb_secret_')) return 'secret';
  if (key.startsWith('sb_publishable_')) return 'publishable';
  try {
    const payload = key.split('.')[1];
    const json = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    return typeof json?.role === 'string' ? json.role : 'unknown';
  } catch {
    return 'unknown';
  }
}

export const supabaseKeyRole = detectKeyRole(supabaseKey);
export const isUsingPrivilegedKey = supabaseKeyRole === 'service_role' || supabaseKeyRole === 'secret';

if (!isUsingPrivilegedKey) {
  console.warn(
    `[Security] Supabase server client is using a "${supabaseKeyRole}" key, not service_role. ` +
      'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for the active project before tightening RLS policies.'
  );
}

// Server-side client using active Sift AI Supabase project
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Base client exported for server-side route compatibility
export const supabase = supabaseAdmin;
