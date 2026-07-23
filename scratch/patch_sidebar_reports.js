const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'Sidebar.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add FileSpreadsheet to imports
if (!content.includes('FileSpreadsheet')) {
  content = content.replace(
    `  LogOut,\n  History\n} from 'lucide-react';`,
    `  LogOut,\n  History,\n  FileSpreadsheet\n} from 'lucide-react';`
  );
}

// 2. Add reports page to visibleMenuItems
const targetMenuBlock = `  if (userProfile?.role === 'system_admin' || userProfile?.role === 'super_admin') {
    visibleMenuItems.push({ href: '/audit-logs', label: t('auditLogs'), icon: History });
  }`;

const replacementMenuBlock = `  if (userProfile?.role === 'system_admin' || userProfile?.role === 'super_admin') {
    visibleMenuItems.push({ href: '/audit-logs', label: t('auditLogs'), icon: History });
  }
  if (allowedPermissions.includes('export_csv')) {
    visibleMenuItems.push({ href: '/reports', label: language === 'th' ? 'รายงานและส่งออก' : 'Reports & Export', icon: FileSpreadsheet });
  }`;

content = content.replace(targetMenuBlock, replacementMenuBlock);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched Sidebar.tsx with Reports menu!');
