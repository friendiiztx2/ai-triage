const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'users', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes("import { useLanguage }")) {
  content = content.replace(
    `import { saveAuditLog } from '@/lib/audit';`,
    `import { saveAuditLog } from '@/lib/audit';\nimport { useLanguage } from '@/components/LanguageContext';`
  );
}

// 2. Add hook call inside UsersPage
if (!content.includes("const { t, language } = useLanguage();")) {
  content = content.replace(
    `export default function UsersPage() {`,
    `export default function UsersPage() {\n  const { t, language } = useLanguage();`
  );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched users/page.tsx with useLanguage import & hook!');
