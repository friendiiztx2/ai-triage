const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'Sidebar.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Localize 'สิทธิ์:'
content = content.replace(
  `สิทธิ์: <span className="font-bold text-indigo-650`,
  `{language === 'th' ? 'สิทธิ์:' : 'Role:'} <span className="font-bold text-indigo-650`
);
// In case the class color is indigo-600 or slate-600
content = content.replace(
  `สิทธิ์: <span className="font-bold text-indigo-600`,
  `{language === 'th' ? 'สิทธิ์:' : 'Role:'} <span className="font-bold text-indigo-600`
);

// 2. Localize 'Mika Co. (บริษัทเริ่มต้น)'
content = content.replace(
  `Mika Co. (บริษัทเริ่มต้น)`,
  `{language === 'th' ? 'Mika Co. (บริษัทเริ่มต้น)' : 'Mika Co. (Default)'}`
);
// Re-replace if it matches again
content = content.replace(
  `Mika Co. (บริษัทเริ่มต้น)`,
  `{language === 'th' ? 'Mika Co. (บริษัทเริ่มต้น)' : 'Mika Co. (Default)'}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully localized Sidebar.tsx!');
