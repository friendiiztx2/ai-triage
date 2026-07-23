const fs = require('fs');
const path = require('path');

function search(dir) {
  fs.readdirSync(dir).forEach(file => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') search(p);
    } else {
      const content = fs.readFileSync(p, 'utf8');
      if (content.includes('Chat ID') || content.includes('chats_report')) {
        console.log(`Matching file: ${p}`);
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('Chat ID') || line.includes('chats_report') || line.includes('headers')) {
            console.log(`  ${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
  });
}

search(path.join(__dirname, '..', 'src'));
