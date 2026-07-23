const http = require('http');

http.get('http://localhost:3000/api/chats', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Total chats returned:', Array.isArray(json) ? json.length : 'not an array');
      if (Array.isArray(json) && json.length > 0) {
        console.log('First chat keys:', Object.keys(json[0]));
        console.log('chat-0104 in api data:', json.find(c => c.id === 'chat-0104'));
      } else {
        console.log('Response:', json);
      }
    } catch (e) {
      console.log('Error parsing JSON:', e.message);
      console.log('Raw data preview:', data.substring(0, 200));
    }
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
