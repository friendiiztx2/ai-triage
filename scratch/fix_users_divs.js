const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'users', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Verify line 699 (index 698)
console.log('Line 699:', lines[698]);
// Verify lines 935-936 (index 934-935)
console.log('Line 935:', lines[934]);
console.log('Line 936:', lines[935]);

// We delete index 698
lines.splice(698, 1);

// After deleting 1 line, the indices of the second set shift by -1.
// Original index 934 and 935 become 933 and 934.
console.log('Verify shifted Line 934:', lines[933]);
console.log('Verify shifted Line 935:', lines[934]);

// Delete shifted index 933 and 934
lines.splice(933, 2);

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Successfully fixed divs in users/page.tsx!');
