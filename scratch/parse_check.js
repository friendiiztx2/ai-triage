const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'users', 'page.tsx');
const code = fs.readFileSync(filePath, 'utf8');

// A simple bracket matching diagnostic
const stack = [];
const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '{') {
      stack.push({ char, line: i + 1, col: j + 1 });
    } else if (char === '}') {
      if (stack.length === 0) {
        console.log(`Unmatched '}' at line ${i + 1}, col ${j + 1}`);
      } else {
        stack.pop();
      }
    }
  }
}

console.log('Parsing finished. Remaining open brackets in stack:', stack.length);
if (stack.length > 0) {
  console.log('Top open brackets in stack:');
  stack.slice(-10).forEach(item => {
    console.log(`  Opened '{' at line ${item.line}, col ${item.col}: ${lines[item.line - 1].trim()}`);
  });
}
