const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env or .env.local
let envUrl = '';
let envKey = '';

const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
envFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach(line => {
      const matchUrl = line.match(/^\s*SUPABASE_URL\s*=\s*(.+)$/) || line.match(/^\s*NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.+)$/);
      const matchKey = line.match(/^\s*SUPABASE_ANON_KEY\s*=\s*(.+)$/) || line.match(/^\s*NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.+)$/);
      if (matchUrl) envUrl = matchUrl[1].trim().replace(/^['"]|['"]$/g, '');
      if (matchKey) envKey = matchKey[1].trim().replace(/^['"]|['"]$/g, '');
    });
  }
});

console.log('Supabase URL:', envUrl);

if (!envUrl || !envKey) {
  console.error('Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(envUrl, envKey);

async function run() {
  const { data, error } = await supabase.from('chats').select('*').limit(5);
  if (error) {
    console.error('Error fetching chats:', error);
  } else {
    console.log('Chats count:', data.length);
    console.log('Sample chat:', JSON.stringify(data[0], null, 2));
  }
}

run();
