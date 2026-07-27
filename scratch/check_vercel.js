async function checkVercel() {
  try {
    const res = await fetch('https://ai-triage-eta.vercel.app/api/chats');
    console.log('Vercel API Status:', res.status);
    const data = await res.json();
    console.log('Vercel /api/chats returned items:', data.length);
  } catch (err) {
    console.error('Error fetching Vercel:', err.message);
  }
}

checkVercel();
