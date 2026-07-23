const fs = require('fs');
const path = require('path');

function listFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        console.log(`Directory: ${fullPath}`);
        listFiles(fullPath);
      }
    } else {
      console.log(`File: ${fullPath}`);
    }
  }
}

listFiles(path.join(__dirname, '..', 'src', 'app'));
