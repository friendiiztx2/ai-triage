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
  const { data: issues, error } = await supabase.from('chat_issues').select('*');
  if (error) {
    console.error('Error fetching chat_issues:', error);
  } else {
    console.log(`Found ${issues.length} chat issues in database:`);
    issues.forEach(iss => {
      console.log(`- ID: ${iss.id} | Chat ID: ${iss.chat_id} | Title: ${iss.title} | Category: ${iss.category_id}`);
    });
  }
}

run();
