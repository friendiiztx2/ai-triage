import { createClient, SupabaseClient } from '@supabase/supabase-js';

const ACTIVE_SUPABASE_URL = 'https://dmorfsududiqtnzrhdvb.supabase.co';
const ACTIVE_SUPABASE_KEY =
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
    ? ACTIVE_SUPABASE_KEY
    : rawKey;

// Server-side client using active Sift AI Supabase project
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl || ACTIVE_SUPABASE_URL,
  supabaseKey || ACTIVE_SUPABASE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Graceful client-side guard: when imported in browser where server-only keys are hidden,
// channel/realtime subscriptions won't throw or spam invalid WebSocket errors.
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseKey)) {
  const dummyChannel: any = {
    on: () => dummyChannel,
    subscribe: () => dummyChannel,
    unsubscribe: () => Promise.resolve('ok'),
  };
  (supabaseAdmin as any).channel = () => dummyChannel;
  (supabaseAdmin as any).removeChannel = () => Promise.resolve('ok');
}

// Base client exported for server-side route compatibility
export const supabase = supabaseAdmin;
