const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'chats', 'page.tsx');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

lines.forEach((line, index) => {
  if (line.includes('ค้นหาลูกค้า') || line.includes('สถานะ: ทั้งหมด') || line.includes('select') || line.includes('Filter Selects')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
