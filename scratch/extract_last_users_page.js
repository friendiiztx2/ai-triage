const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\a4b38d80-5e88-437b-b5bb-c365ae0b0d29\\.system_generated\\logs\\transcript.jsonl';
const rl = require('readline').createInterface({
  input: fs.createReadStream(logPath),
  terminal: false
});

let lastContent = null;

rl.on('line', (line) => {
  if (line.includes('src/app/users/page.tsx') && line.includes('CodeContent')) {
    try {
      const obj = JSON.parse(line);
      // Traverse to find write_to_file or edit tool call arguments
      if (obj.tool_calls) {
        for (const tc of obj.tool_calls) {
          if (tc.name === 'write_to_file' && tc.args.TargetFile.endsWith('users/page.tsx')) {
            lastContent = tc.args.CodeContent;
          }
        }
      }
    } catch (e) {}
  }
});

rl.on('close', () => {
  if (lastContent) {
    fs.writeFileSync(path.join(__dirname, 'recovered_users_page.tsx'), lastContent);
    console.log('Successfully recovered last content!');
  } else {
    console.log('No content found in transcript.');
  }
});
