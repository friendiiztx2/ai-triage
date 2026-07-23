const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        searchDir(fullPath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('กำลังตรวจสอบสิทธิ์การใช้งาน')) {
        console.log(`Found in: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('กำลังตรวจสอบสิทธิ์การใช้งาน')) {
            console.log(`  Line ${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchDir(path.join(__dirname, '..', 'src'));
