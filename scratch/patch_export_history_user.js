const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'reports', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace static historyLogs with stateful exportHistory
const oldHistoryLogsDef = `  // History list (simulated past downloads logs)
  const historyLogs = [
    { id: 'EXP-1092', name: 'chats_weekly_triage_report.csv', type: 'Weekly Summary', date: '2026-07-19', size: '14.2 KB', status: 'ready' },
    { id: 'EXP-1091', name: 'july_customer_support_kpi.csv', type: 'Monthly Audit', date: '2026-07-15', size: '48.9 KB', status: 'ready' },
    { id: 'EXP-1089', name: 'categories_distribution_dataset.csv', type: 'Category Stats', date: '2026-07-10', size: '8.4 KB', status: 'ready' },
    { id: 'EXP-1084', name: 'system_admin_audit_logs.csv', type: 'Security Audit', date: '2026-07-01', size: '124.1 KB', status: 'archived' }
  ];`;

const newHistoryLogsDef = `  // History list state (starts with pre-seeded past downloads logs)
  const [exportHistory, setExportHistory] = useState([
    { id: 'EXP-1092', name: 'chats_weekly_triage_report.csv', type: 'Weekly Summary', date: '2026-07-19', size: '14.2 KB', status: 'ready', user: 'aor' },
    { id: 'EXP-1091', name: 'july_customer_support_kpi.csv', type: 'Monthly Audit', date: '2026-07-15', size: '48.9 KB', status: 'ready', user: 'system_admin' },
    { id: 'EXP-1089', name: 'categories_distribution_dataset.csv', type: 'Category Stats', date: '2026-07-10', size: '8.4 KB', status: 'ready', user: 'aor' },
    { id: 'EXP-1084', name: 'system_admin_audit_logs.csv', type: 'Security Audit', date: '2026-07-01', size: '124.1 KB', status: 'archived', user: 'system_admin' }
  ]);`;

content = content.replace(oldHistoryLogsDef, newHistoryLogsDef);

// 2. Prepend to state in handleExport
const targetHandleExportEnd = `    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Save audit log
    fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'EXPORT',
        details: \`ส่งออกรายงานข้อมูลแชตสำเร็จ (พบบันทึกทั้งหมด: \${result.length} เคส, ฟิลเตอร์ช่วงเวลา: \${dateRange})\`
      })
    }).catch(e => console.error('Error logging audit export:', e));
  };`;

const replacementHandleExportEnd = `    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Add new dynamic export record to list
    const newId = \`EXP-\${Math.floor(1000 + Math.random() * 9000)}\`;
    const sizeStr = \`\${(blob.size / 1024).toFixed(1)} KB\`;
    setExportHistory(prev => [
      {
        id: newId,
        name: filename,
        type: selectedCategory === 'all' ? 'All Mapped Export' : 'Filtered Triage',
        date: new Date().toISOString().substring(0, 10),
        size: sizeStr,
        status: 'ready',
        user: userProfile?.name || 'admin'
      },
      ...prev
    ]);

    // Save audit log
    fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'EXPORT',
        details: \`ส่งออกรายงานข้อมูลแชตสำเร็จ (พบบันทึกทั้งหมด: \${result.length} เคส, ฟิลเตอร์ช่วงเวลา: \${dateRange})\`
      })
    }).catch(e => console.error('Error logging audit export:', e));
  };`;

content = content.replace(targetHandleExportEnd, replacementHandleExportEnd);

// 3. Update UI rendering block mapping over exportHistory and showing user tag
const targetJSXLoop = `            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {historyLogs.map(log => (
                <div key={log.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-450 dark:text-slate-505 shrink-0">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block truncate">{log.name}</span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-semibold">
                        <span>ID: {log.id}</span>
                        <span>•</span>
                        <span>{log.type}</span>
                        <span>•</span>
                        <span>{new Date(log.date).toLocaleDateString('th-TH')}</span>
                      </div>
                    </div>
                  </div>`;

// Note the icon color change or text-slate color might have slight difference
// Let's replace the whole section safely by locating `historyLogs.map` loop.
const targetJSXLoopFixed = `            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {exportHistory.map(log => (
                <div key={log.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-450 dark:text-slate-500 shrink-0">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block truncate">{log.name}</span>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-405 dark:text-slate-400 mt-1 font-semibold">
                        <span>ID: {log.id}</span>
                        <span>•</span>
                        <span>{log.type}</span>
                        <span>•</span>
                        <span>{new Date(log.date).toLocaleDateString('th-TH')}</span>
                        <span>•</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5 select-none">
                          👤 {language === 'th' ? \`โดย: \${log.user}\` : \`By: \${log.user}\`}
                        </span>
                      </div>
                    </div>
                  </div>`;

content = content.replace(
  `            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">\n              {historyLogs.map(log => (`,
  `            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">\n              {exportHistory.map(log => (`
);

content = content.replace(
  `                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 font-semibold">\n                        <span>ID: {log.id}</span>\n                        <span>•</span>\n                        <span>{log.type}</span>\n                        <span>•</span>\n                        <span>{new Date(log.date).toLocaleDateString('th-TH')}</span>\n                      </div>`,
  `                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400 mt-1 font-semibold">\n                        <span>ID: {log.id}</span>\n                        <span>•</span>\n                        <span>{log.type}</span>\n                        <span>•</span>\n                        <span>{new Date(log.date).toLocaleDateString('th-TH')}</span>\n                        <span>•</span>\n                        <span className="text-indigo-600 dark:text-indigo-455 font-bold flex items-center gap-0.5 select-none">\n                          👤 {language === 'th' ? \`โดย: \${log.user}\` : \`By: \${log.user}\`}\n                        </span>\n                      </div>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched reports/page.tsx with stateful history logs and user labels!');
