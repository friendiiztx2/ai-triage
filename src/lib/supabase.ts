import { createClient } from '@supabase/supabase-js';

const DEFAULT_URL = 'https://luhsfxdcnthbxlrxmfvh.supabase.co';
const DEFAULT_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aHNmeGRjbnRoYnhscnhtZnZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTcyNDg5MywiZXhwIjoyMTAxMzAwMDg5M30.gJ0Jl7A-CWShuIfWeLiE_MFte2MDvWy40XcE9pNWEhM';

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
