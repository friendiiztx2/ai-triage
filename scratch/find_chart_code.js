const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

lines.forEach((line, index) => {
  if (line.includes('เปรียบเทียบแนวโน้ม') || line.includes('Category Trends') || line.includes('LineChart') || line.includes('ResponsiveContainer')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
