const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'chats', 'page.tsx');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

lines.forEach((line, index) => {
  if (line.includes('status') || line.includes('แยกแยะ') || line.includes('completed')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
