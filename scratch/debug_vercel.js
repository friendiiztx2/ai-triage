async function debugVercel() {
  try {
    const res = await fetch('https://ai-triage-eta.vercel.app/api/chats');
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response text:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

debugVercel();
