const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') walk(p);
    } else if (p.endsWith('.ts') || p.endsWith('.tsx') || p.endsWith('.js') || p.endsWith('.json') || p.endsWith('.sql')) {
      const content = fs.readFileSync(p, 'utf8');
      if (content.includes('GoogleGenAI') || content.includes('@google/generative-ai') || content.includes('prompt') || content.includes('Instruction') || content.includes('triage')) {
        // Log filename and match context
        console.log('Match in file:', p);
      }
    }
  });
}

walk('.');
