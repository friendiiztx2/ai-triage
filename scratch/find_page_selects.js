const fs = require('fs');
const path = require('path');

const files = [
  path.join(__dirname, '..', 'src', 'app', 'page.tsx'),
  path.join(__dirname, '..', 'src', 'app', 'chats', 'page.tsx'),
  path.join(__dirname, '..', 'src', 'app', 'audit-logs/page.tsx')
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    console.log(`=== File: ${path.basename(file)} ===`);
    lines.forEach((line, index) => {
      if (line.includes('<select') || line.includes('<option')) {
        console.log(`${index + 1}: ${line.trim()}`);
      }
    });
  }
});
