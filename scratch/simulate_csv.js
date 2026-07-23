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
  const catRes = await supabase.from('categories').select('*');
  const chatsRes = await supabase.from('chats').select('*');
  
  const categories = catRes.data || [];
  const chats = chatsRes.data || [];
  
  const headers = ['Chat ID', 'Customer Name', 'Status', 'Priority', 'Category', 'AI Summary', 'Created At'];
  
  const rows = chats.map(c => [
    c.id,
    c.customer_name || ('ลูกค้า #' + (c.customer_id || c.id?.substring(0, 8))),
    c.status || 'pending',
    c.priority || 'low',
    categories.find(cat => cat.id === c.category_id)?.name || c.category_id || 'อื่นๆ',
    (c.summary || '').replace(/"/g, '""'),
    c.created_at ? new Date(c.created_at).toLocaleString('th-TH') : '-'
  ]);
  
  console.log('Total rows simulated:', rows.length);
  console.log('Simulated row 0:', rows[0]);
  console.log('Simulated row 1:', rows[1]);
  
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
    + [headers.join(','), ...rows.map(e => e.map(val => '"' + (val || '') + '"').join(','))].join('\n');
    
  fs.writeFileSync('scratch/simulated_output.csv', csvContent, 'utf8');
  console.log('Wrote to scratch/simulated_output.csv');
}

run();
