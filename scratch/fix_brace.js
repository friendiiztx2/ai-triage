const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'users', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('Line 333 is:', lines[332]);
if (lines[332].trim() === '};') {
  lines.splice(332, 1);
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('Successfully removed extra brace!');
} else {
  console.log('Line did not match extra brace!');
}
