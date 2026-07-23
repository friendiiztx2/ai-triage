const supabaseUrl = 'https://sqiruksrrcwxmjeqechb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxaXJ1a3NycmN3eG1qZXFlY2hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NzY0NDEsImV4cCI6MjA5OTE1MjQ0MX0.bmQIvUmyAg2GClkWCkyWpC4VpHd9TDfeu1OgCz30uhM';

async function checkSchema() {
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  };

  try {
    console.log("--- Fetching one row from 'chats' ---");
    const chatRes = await fetch(`${supabaseUrl}/rest/v1/chats?select=*&limit=1`, { headers });
    const chatData = await chatRes.json();
    console.log(chatData);

    console.log("\n--- Fetching one row from 'categories' ---");
    const catRes = await fetch(`${supabaseUrl}/rest/v1/categories?select=*&limit=1`, { headers });
    const catData = await catRes.json();
    console.log(catData);

    console.log("\n--- Fetching one row from 'customers' ---");
    const custRes = await fetch(`${supabaseUrl}/rest/v1/customers?select=*&limit=1`, { headers });
    const custData = await custRes.json();
    console.log(custData);

  } catch (err) {
    console.error("Error:", err);
  }
}

checkSchema();
