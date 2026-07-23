const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'chats', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

lines.forEach((line, index) => {
  if (line.includes('export default function ChatsPage') || line.includes('const [chats') || line.includes('const fetchChats')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
