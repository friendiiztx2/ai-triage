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
  const { data: chats, error } = await supabase.from('chats').select('id, category_id, conversation, summary');
  if (error) {
    console.error('Error fetching chats:', error);
  } else {
    console.log(`Successfully fetched ${chats.length} chats.`);
    chats.forEach((chat, i) => {
      console.log(`\n================ CHAT #${i+1} (${chat.id}) ================`);
      console.log(`Category ID: ${chat.category_id}`);
      console.log(`Summary: ${chat.summary}`);
      console.log('Conversation:');
      
      let messages = [];
      try {
        if (typeof chat.conversation === 'string') {
          messages = JSON.parse(chat.conversation);
        } else if (Array.isArray(chat.conversation)) {
          messages = chat.conversation;
        }
      } catch (e) {
        messages = [];
      }
      
      messages.forEach(m => {
        console.log(`  [${m.sender}]: ${m.text}`);
      });
    });
  }
}

run();
