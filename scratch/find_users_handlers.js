const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'users', 'page.tsx');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

lines.forEach((line, index) => {
  if (line.includes('const handleSubmit =') || line.includes('const handleSavePatch =') || line.includes('const handleDeleteUser =')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
