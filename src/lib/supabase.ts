import { createClient } from '@supabase/supabase-js';

const DEFAULT_URL = 'https://sqiruksrrcwxmjeqechb.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxaXJ1a3NycmN3eG1qZXFlY2hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NzY0NDEsImV4cCI6MjA5OTE1MjQ0MX0.bmQIvUmyAg2GClkWCkyWpC4VpHd9TDfeu1OgCz30uhM';

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
