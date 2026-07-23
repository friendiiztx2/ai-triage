const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('bg-indigo-65') || line.includes('hover:bg-indigo-75') || line.includes('bg-indigo-75')) {
          console.log(`${fullPath}:${index + 1}: ${line.trim()}`);
        }
      });
    }
  }
}

console.log('Searching for Tailwind color typos...');
searchDir(path.join(__dirname, '..', 'src'));
console.log('Search finished.');
