const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'chats', 'page.tsx');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

lines.forEach((line, index) => {
  if (line.includes('priority ===') || line.includes('Urgent') || line.includes('bg-amber-50') || line.includes('bg-rose-50')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
