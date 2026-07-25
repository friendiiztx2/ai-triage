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
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompanyQuery() {
  const companyId = '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2';
  const { data, error, count } = await supabase
    .from('chats')
    .select('id, status, priority, category_id', { count: 'exact' })
    .eq('company_id', companyId);

  console.log('Error:', error);
  console.log('Count for company_id 2c3f46cc-fae8-4ef8-99e1-874dec8b2af2:', count);
}

testCompanyQuery();
