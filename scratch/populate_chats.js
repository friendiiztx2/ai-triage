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

async function populateChatsFromIssues() {
  const { data: issues, error } = await supabase.from('chat_issues').select('*');
  if (error || !issues) {
    console.error('Error fetching issues:', error);
    return;
  }

  console.log('Total issues:', issues.length);

  // Group issues by chat_id
  const chatMap = new Map();

  for (const issue of issues) {
    const chatId = issue.chat_id;
    if (!chatId) continue;

    if (!chatMap.has(chatId)) {
      chatMap.set(chatId, {
        id: chatId,
        customer_id: 'cust-001',
        company_id: '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2',
        summary: issue.summary,
        category_id: issue.category_id,
        priority: issue.priority,
        status: 'pending',
        confidence: 95,
        conversation: JSON.stringify([
          { sender: 'customer', message: issue.summary, time: new Date(issue.created_at || Date.now()).toLocaleTimeString('th-TH') },
          { sender: 'agent', message: issue.recommended_reply || 'สวัสดีครับ ทีมงานกำลังดำเนินการตรวจสอบให้ครับ', time: new Date(issue.created_at || Date.now()).toLocaleTimeString('th-TH') }
        ]),
        created_at: issue.created_at || new Date().toISOString()
      });
    } else {
      const existing = chatMap.get(chatId);
      const priOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      if ((priOrder[issue.priority?.toLowerCase()] || 0) > (priOrder[existing.priority?.toLowerCase()] || 0)) {
        existing.priority = issue.priority;
        existing.category_id = issue.category_id;
      }
    }
  }

  const newChats = Array.from(chatMap.values());
  console.log(`Inserting ${newChats.length} restored chats into Supabase...`);

  for (let i = 0; i < newChats.length; i += 50) {
    const batch = newChats.slice(i, i + 50);
    const { error: insertErr } = await supabase.from('chats').upsert(batch);
    if (insertErr) {
      console.error('Batch insert error:', insertErr);
    }
  }

  const { count } = await supabase.from('chats').select('*', { count: 'exact' });
  console.log('Successfully restored chats! Current count in DB:', count);
}

populateChatsFromIssues();
