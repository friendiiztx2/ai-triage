const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'users', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Delete lines 870 to 901 (using 1-based indexing as printed earlier: index 869 to 900)
// Let's verify line contents before splicing to make sure we hit the correct lines!
const linesToInspect = lines.slice(869, 901);
console.log('Lines to delete:');
linesToInspect.forEach((l, i) => console.log(`${870 + i}: ${l}`));

if (linesToInspect[0].includes('ref={editDropdownRef}') && linesToInspect[linesToInspect.length - 1].includes('</div>')) {
  // Safe to delete!
  lines.splice(869, 32); // Splicing 32 lines starting from index 869 (line 870)
  
  // Now write back
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('Successfully deleted the duplicate/broken block!');
} else {
  console.log('Line verification failed! Not deleting.');
}
