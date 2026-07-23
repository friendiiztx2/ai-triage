const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'audit-logs', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const linesToInspect = lines.slice(235, 249);
console.log('Lines to delete:');
linesToInspect.forEach((l, i) => console.log(`${236 + i}: ${l}`));

if (linesToInspect[0].includes('</div>-slate-805') && linesToInspect[linesToInspect.length - 1].includes('</div>')) {
  lines.splice(235, 14); // Delete 14 lines starting from index 235
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('Successfully cleaned up leftover duplicate block!');
} else {
  console.log('Line verification failed! Not deleting.');
}
