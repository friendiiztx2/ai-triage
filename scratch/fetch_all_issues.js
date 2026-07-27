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

async function testFetchAll() {
  const { data: issues, error } = await supabase
    .from('chat_issues')
    .select('*');

  console.log('Error:', error);
  console.log('Total chat_issues fetched:', issues ? issues.length : 0);

  if (issues) {
    const chatMap = new Map();
    issues.forEach(issue => {
      const chatId = issue.chat_id || 'chat-001';
      chatMap.set(chatId, true);
    });
    console.log('Unique chat_id count:', chatMap.size);
  }
}

testFetchAll();
