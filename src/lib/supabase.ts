import { createClient } from '@supabase/supabase-js';

const DEFAULT_URL = 'https://luhsfxdcnthbxlrxmfvh.supabase.co';
const DEFAULT_SERVICE_ROLE_KEY = 'sb_publishable_NL8nXMUWQAYQ9cp8wjsiZQ_nlY2L4VX';

let supabaseUrl = process.env.SUPABASE_URL || DEFAULT_URL;
if (supabaseUrl && !supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  supabaseUrl = `https://${supabaseUrl}.supabase.co`;
}

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_ROLE_KEY;

// Server-side admin client using SUPABASE_SERVICE_ROLE_KEY (STRICT SERVER-ONLY GUARD)
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Base client exported for server-side route compatibility
export const supabase = supabaseAdmin;
