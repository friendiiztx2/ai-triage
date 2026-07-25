async function testApiChats() {
  try {
    const res = await fetch('http://localhost:3000/api/chats');
    const data = await res.json();
    console.log('API /api/chats returned count:', data.length);
    console.log('Sample chat 0:', data[0]);
  } catch (err) {
    console.error('Error fetching API:', err);
  }
}

testApiChats();
