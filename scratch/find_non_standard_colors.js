const fs = require('fs');
const path = require('path');

const nonStandardPatterns = [
  /slate-955/i,
  /slate-855/i,
  /slate-850/i,
  /slate-750/i,
  /slate-705/i,
  /slate-805/i,
  /slate-455/i,
  /slate-450/i,
  /slate-505/i,
  /slate-655/i,
  /slate-650/i,
  /slate-750/i,
  /slate-355/i,
  /slate-350/i,
  /slate-255/i,
  /slate-250/i,
  /slate-770/i,
  /indigo-955/i,
  /indigo-755/i
];

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
        let found = false;
        for (const pattern of nonStandardPatterns) {
          if (pattern.test(line)) {
            found = true;
            break;
          }
        }
        if (found) {
          console.log(`${fullPath}:${index + 1}: ${line.trim()}`);
        }
      });
    }
  }
}

console.log('Searching for non-standard Tailwind colors...');
searchDir(path.join(__dirname, '..', 'src'));
console.log('Finished search.');
