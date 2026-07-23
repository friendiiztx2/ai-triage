const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'reports', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update initial exportHistory dates to include time
content = content.replace(
  `{ id: 'EXP-1092', name: 'chats_weekly_triage_report.csv', type: 'Weekly Summary', date: '2026-07-19', size: '14.2 KB', status: 'ready', user: 'aor' }`,
  `{ id: 'EXP-1092', name: 'chats_weekly_triage_report.csv', type: 'Weekly Summary', date: '2026-07-19T14:32:15Z', size: '14.2 KB', status: 'ready', user: 'aor' }`
);
content = content.replace(
  `{ id: 'EXP-1091', name: 'july_customer_support_kpi.csv', type: 'Monthly Audit', date: '2026-07-15', size: '48.9 KB', status: 'ready', user: 'system_admin' }`,
  `{ id: 'EXP-1091', name: 'july_customer_support_kpi.csv', type: 'Monthly Audit', date: '2026-07-15T11:05:40Z', size: '48.9 KB', status: 'ready', user: 'system_admin' }`
);
content = content.replace(
  `{ id: 'EXP-1089', name: 'categories_distribution_dataset.csv', type: 'Category Stats', date: '2026-07-10', size: '8.4 KB', status: 'ready', user: 'aor' }`,
  `{ id: 'EXP-1089', name: 'categories_distribution_dataset.csv', type: 'Category Stats', date: '2026-07-10T16:45:08Z', size: '8.4 KB', status: 'ready', user: 'aor' }`
);
content = content.replace(
  `{ id: 'EXP-1084', name: 'system_admin_audit_logs.csv', type: 'Security Audit', date: '2026-07-01', size: '124.1 KB', status: 'archived', user: 'system_admin' }`,
  `{ id: 'EXP-1084', name: 'system_admin_audit_logs.csv', type: 'Security Audit', date: '2026-07-01T09:20:00Z', size: '124.1 KB', status: 'archived', user: 'system_admin' }`
);

// 2. Change dynamic date generation to full ISO string
content = content.replace(
  `date: new Date().toISOString().substring(0, 10),`,
  `date: new Date().toISOString(),`
);

// 3. Change date render to full date and time string
content = content.replace(
  `<span>{new Date(log.date).toLocaleDateString('th-TH')}</span>`,
  `<span>{language === 'th' ? new Date(log.date).toLocaleString('th-TH') : new Date(log.date).toLocaleString('en-US', { hour12: false })}</span>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched reports/page.tsx with date & time formatters!');
