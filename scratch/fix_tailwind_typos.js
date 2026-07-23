const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'users', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace invalid color classes with standard Tailwind classes
content = content.replace(/indigo-650/g, 'indigo-600');
content = content.replace(/indigo-750/g, 'indigo-700');
content = content.replace(/indigo-755/g, 'indigo-700');
content = content.replace(/indigo-655/g, 'indigo-600');
content = content.replace(/indigo-605/g, 'indigo-600');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully replaced typos in src/app/users/page.tsx!");
