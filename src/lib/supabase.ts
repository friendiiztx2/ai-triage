import { createClient } from '@supabase/supabase-js';

const DEFAULT_URL = 'https://luhsfxdcnthbxlrxmfvh.supabase.co';
const DEFAULT_ANON_KEY = 'sb_publishable_NL8nXMUWQAYQ9cp8wjsiZQ_nlY2L4VX';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_URL;
if (supabaseUrl && !supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  supabaseUrl = `https://${supabaseUrl}.supabase.co`;
}
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// Base client for public queries
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side admin client using SUPABASE_SERVICE_ROLE_KEY (STRICT SERVER-ONLY GUARD)
const isServer = typeof window === 'undefined';

export const supabaseAdmin = (isServer && serviceRoleKey)
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : supabase;
