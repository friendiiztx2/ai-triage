import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.SUPABASE_URL || '';
if (supabaseUrl && !supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  supabaseUrl = `https://${supabaseUrl}.supabase.co`;
}

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  '';

// Server-side client using strictly server-only environment variables
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
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
