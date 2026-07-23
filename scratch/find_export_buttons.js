const fs = require('fs');
const path = require('path');

function search(dir) {
  fs.readdirSync(dir).forEach(file => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') search(p);
    } else {
      const content = fs.readFileSync(p, 'utf8');
      if (content.includes('ส่งออกรายงาน') || content.includes('export_csv')) {
        console.log(`Matching file: ${p}`);
      }
    }
  });
}

search(path.join(__dirname, '..', 'src'));
