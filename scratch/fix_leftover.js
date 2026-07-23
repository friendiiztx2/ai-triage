const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'users', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const checkLines = lines.slice(617, 654);
console.log('Lines to delete:');
checkLines.forEach((l, i) => console.log(`${618 + i}: ${l}`));

if (checkLines[1].includes('if (isChecked)') && checkLines[checkLines.length - 1].includes('</td>')) {
  // Replace lines from index 618 to 653 (36 lines) with just a closing </td>
  lines.splice(618, 36, '                        </td>');
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('Successfully fixed leftover code in users/page.tsx!');
} else {
  console.log('Line verification failed! Not applying changes.');
}
