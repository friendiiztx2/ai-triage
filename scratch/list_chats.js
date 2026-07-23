const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
let envUrl = '';
let envKey = '';

const envFiles = ['.env', '.env.local'];
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

const supabase = createClient(envUrl, envKey);

async function run() {
  const { data: chats, error: chatsError } = await supabase
    .from('chats')
    .select('id, customer_name, summary, category_id, ai_recommendation');

  if (chatsError) {
    console.error('Error fetching chats:', chatsError);
    return;
  }

  console.log(`Found ${chats.length} chats:`);
  chats.forEach((chat, idx) => {
    console.log(`\n--- Chat #${idx+1} (${chat.id}) ---`);
    console.log(`Customer: ${chat.customer_name}`);
    console.log(`Summary: ${chat.summary}`);
    console.log(`Primary Category ID: ${chat.category_id}`);
    console.log(`AI Recommendation snippet (first 100 chars):\n${chat.ai_recommendation?.substring(0, 150)}...`);
  });
}

run();
