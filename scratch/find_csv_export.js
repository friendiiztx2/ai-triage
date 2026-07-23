const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        searchDir(fullPath);
      }
    } else if (stat.isFile() && (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes('csv') || content.toLowerCase().includes('export')) {
        console.log(`Found matching file: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('csv') || line.includes('CSV') || line.includes('exportTo')) {
            console.log(`  ${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
  });
}

searchDir(path.join(__dirname, '..', 'src'));
