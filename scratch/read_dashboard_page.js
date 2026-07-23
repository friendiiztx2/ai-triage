const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('csv') || line.includes('CSV') || line.includes('export') || line.includes('ดาวน์โหลด')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
