const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'users', 'page.tsx');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

lines.forEach((line, index) => {
  if (line.includes('Name') || line.includes('Role') || line.includes('Password') || line.includes('Permissions') || line.includes('Tenant')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
