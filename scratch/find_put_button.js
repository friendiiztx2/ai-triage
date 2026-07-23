const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'users', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('แก้ไขสิทธิ์ (PUT)') || line.includes('PUT')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
