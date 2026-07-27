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

// Test with service role key or anon key with company_id filter
async function testQuery() {
  const anonClient = createClient(supabaseUrl, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  // Test 1: Query with company_id
  const companyId = '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2';
  const res1 = await anonClient.from('chat_issues').select('*').eq('company_id', companyId).limit(10);
  console.log('Test 1 (chat_issues with company_id):', res1.data ? res1.data.length : 0, 'Error:', res1.error);

  // Test 2: Query chat_issues directly
  const res2 = await anonClient.from('chat_issues').select('*').limit(10);
  console.log('Test 2 (chat_issues without company_id):', res2.data ? res2.data.length : 0, 'Error:', res2.error);
}

testQuery();
