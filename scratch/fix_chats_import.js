const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'chats', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace import target
content = content.replace(
  `import { useState, useEffect } from 'react';`,
  `import { useState, useEffect } from 'react';\nimport { useLanguage } from '@/components/LanguageContext';`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully fixed useLanguage import in chats/page.tsx!');
