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
  console.log('Starting Supabase database categories migration...');

  // 1. Update chats category_id
  const chatUpdates = [
    { id: 'chat-090', category_id: 'vip_privilege' },
    { id: 'chat-test-1783743143218', category_id: 'promo_bonus' },
    { id: 'chat-063', category_id: 'deposit_withdrawal' },
    { id: 'chat-059', category_id: 'promo_bonus' },
    { id: 'chat-062', category_id: 'promo_bonus' },
    { id: 'chat-066', category_id: 'deposit_withdrawal' },
    { id: 'chat-068', category_id: 'vip_privilege' },
    { id: 'chat-091', category_id: 'vip_privilege' },
    { id: 'chat-072', category_id: 'promo_bonus' },
    { id: 'chat-085', category_id: 'promo_bonus' }
  ];

  for (const item of chatUpdates) {
    const { error } = await supabase
      .from('chats')
      .update({ category_id: item.category_id })
      .eq('id', item.id);

    if (error) {
      console.error(`Error updating chat ${item.id}:`, error.message);
    } else {
      console.log(`Updated chat ${item.id} -> category_id: ${item.category_id}`);
    }
  }

  // 2. Update chat_issues category_id
  const issueUpdates = [
    { id: '49bf77c6-717e-4984-b761-4417dd880cd4', category_id: 'vip_privilege' }, // chat-090
    { id: 'c6c38808-6495-4841-bed6-9640fe6f5b6b', category_id: 'promo_bonus' },   // chat-090
    { id: 'c6600587-1331-4fb6-9c93-7f234ba2dfc7', category_id: 'deposit_withdrawal' }, // chat-091
    { id: '857d0771-b111-4a88-8d18-3f5ff7beb502', category_id: 'vip_privilege' }, // chat-091
    { id: '456b9827-b015-49ef-b7ca-5b409458f205', category_id: 'vip_privilege' }, // chat-091
    { id: 'e5434020-4619-40df-8c1b-a12ebd73e760', category_id: 'promo_bonus' },   // chat-088
    { id: 'dc519122-9938-48c0-88df-ff75b28a339b', category_id: 'promo_bonus' },   // chat-099 (reward exchange)
    { id: '55557674-c534-4b92-a5be-447048531a1c', category_id: 'game_issue' }     // chat-0101 (lottery play)
  ];

  for (const item of issueUpdates) {
    const { error } = await supabase
      .from('chat_issues')
      .update({ category_id: item.category_id })
      .eq('id', item.id);

    if (error) {
      console.error(`Error updating issue ${item.id}:`, error.message);
    } else {
      console.log(`Updated issue ${item.id} -> category_id: ${item.category_id}`);
    }
  }

  console.log('Database categories migration completed successfully!');
}

run();
