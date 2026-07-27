async function testVercelWithHeaders() {
  try {
    const res = await fetch('https://ai-triage-eta.vercel.app/api/chats');
    const data = await res.json();
    console.log('Vercel live /api/chats total returned items:', data.length);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testVercelWithHeaders();
