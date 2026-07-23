const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Find the line index where the comment is
const startIndex = lines.findIndex(line => line.includes('Recent Cases & Admin Activity Feed Row'));

if (startIndex !== -1) {
  // We want to delete from startIndex - 1 (to include the blank line or the line before) to the second to last line (which is the closing div before the end of function)
  // Let's find the closing `</div>` right before the end
  let endIndex = -1;
  for (let i = lines.length - 1; i >= startIndex; i--) {
    if (lines[i].trim() === '</div>' && lines[i+1] && lines[i+1].trim() === '</div>' && lines[i+2] && lines[i+2].trim() === ');' && lines[i+3] && lines[i+3].trim() === '}') {
      endIndex = i + 1; // We keep lines[i+1] and below
      break;
    }
  }

  if (endIndex !== -1) {
    console.log(`Deleting lines from index ${startIndex} to ${endIndex - 1}`);
    lines.splice(startIndex - 1, endIndex - startIndex + 1);
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log('Successfully deleted JSX block precisely!');
  } else {
    // If we can't find structural matching, let's just search for the specific lines
    console.error('Could not find structural match, trying index based');
    const deleteCount = 1084 - 987 + 1;
    lines.splice(986, deleteCount);
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log('Successfully deleted JSX block by indexes!');
  }
} else {
  console.log('Feeds block already deleted or not found.');
}
