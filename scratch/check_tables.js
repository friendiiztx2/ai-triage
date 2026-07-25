const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllTables() {
  const chatsRes = await supabase.from('chats').select('*', { count: 'exact' });
  console.log('Chats count:', chatsRes.count, 'Error:', chatsRes.error);

  const custRes = await supabase.from('customers').select('*', { count: 'exact' });
  console.log('Customers count:', custRes.count, 'Error:', custRes.error);

  const issuesRes = await supabase.from('chat_issues').select('*', { count: 'exact' });
  console.log('Chat Issues count:', issuesRes.count, 'Error:', issuesRes.error);

  const catRes = await supabase.from('categories').select('*', { count: 'exact' });
  console.log('Categories count:', catRes.count, 'Error:', catRes.error);
}

checkAllTables();
