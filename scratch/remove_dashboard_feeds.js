const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove History import from lucide-react if present
content = content.replace(
  `  MessageSquare, \n  Clock, \n  History,`,
  `  MessageSquare, \n  Clock,`
);

// 2. Remove recentLogs state declaration
content = content.replace(
  `  const [recentChats, setRecentChats] = useState<any[]>([]);\n  const [recentLogs, setRecentLogs] = useState<any[]>([]);`,
  `  const [recentChats, setRecentChats] = useState<any[]>([]);`
);

// 3. Remove fetch recent logs from loadDashboardData
const targetFetchLogs = `      // 4. Fetch recent logs for activity stream
      try {
        const logsRes = await fetch('/api/audit-logs');
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setRecentLogs(logsData.slice(0, 5) || []);
        }
      } catch (e) {
        console.error('Error fetching logs for feed:', e);
      }`;
content = content.replace(targetFetchLogs, '');

// 4. Remove fetch recent logs from silentBackgroundReload
const targetFetchLogsSilent = `      // 3. Fetch recent logs
      try {
        const logsRes = await fetch('/api/audit-logs');
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setRecentLogs(logsData.slice(0, 5) || []);
        }
      } catch (e) {}`;
content = content.replace(targetFetchLogsSilent, '');

// 5. Remove JSX block for the two cards
const targetJSX = `      {/* Recent Cases & Admin Activity Feed Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Left Card: Recent Chats */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm transition-all duration-250 flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
              <MessageSquare size={18} className="text-indigo-600 dark:text-indigo-400" />
              {language === 'th' ? 'รายการเคสแชตล่าสุด' : 'Recent Customer Cases'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              {language === 'th' ? 'รายการบทสนทนาของลูกค้า 5 รายการล่าสุดในระบบ' : 'List of the 5 most recent customer conversations'}
            </p>
          </div>
          
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {recentChats.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                {language === 'th' ? 'ไม่มีรายการเคสแชตในขณะนี้' : 'No customer cases available'}
              </div>
            ) : (
              recentChats.map((chat: any) => {
                let priorityColor = 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
                if (chat.priority?.toLowerCase() === 'urgent') priorityColor = 'bg-rose-50 text-rose-600 dark:bg-rose-955/30 dark:text-rose-455';
                else if (chat.priority?.toLowerCase() === 'high') priorityColor = 'bg-amber-50 text-amber-600 dark:bg-amber-955/30 dark:text-amber-400';
                else if (chat.priority?.toLowerCase() === 'medium') priorityColor = 'bg-blue-50 text-blue-600 dark:bg-blue-955/30 dark:text-blue-400';
                
                return (
                  <Link 
                    key={chat.id}
                    href={\`/chats\`}
                    className="flex items-center justify-between py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-855/20 transition px-2 rounded-xl group"
                  >
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-xs text-slate-855 dark:text-slate-200 truncate max-w-[120px]">{chat.customer_name || 'Customer'}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-505">{new Date(chat.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[280px]">{chat.summary || (language === 'th' ? 'ไม่มีข้อสรุป' : 'No summary')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={\`px-2 py-0.5 rounded-md text-[9px] font-bold \${priorityColor} uppercase\`}>
                        {chat.priority || 'low'}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700 group-hover:translate-x-1 transition-transform">➡️</span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Right Card: Admin Activity Feed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm transition-all duration-250 flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
              <History size={18} className="text-emerald-600 dark:text-emerald-450" />
              {language === 'th' ? 'บันทึกกิจกรรมล่าสุด' : 'Recent Admin Activity'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              {language === 'th' ? 'สตรีมกิจกรรมการล็อกอิน การปรับสิทธิ์ หรือแก้ไขข้อมูลของแอดมิน' : 'Real-time feed of admin changes, logins and permission edits'}
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {recentLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                {language === 'th' ? 'ไม่มีบันทึกกิจกรรมล่าสุด' : 'No activity logs available'}
              </div>
            ) : (
              recentLogs.map((log: any) => {
                let badgeColor = 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
                if (log.action === 'CREATE') badgeColor = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-955/30 dark:text-emerald-400';
                else if (log.action === 'UPDATE') badgeColor = 'bg-blue-50 text-blue-600 dark:bg-blue-955/30 dark:text-blue-400';
                else if (log.action === 'DELETE') badgeColor = 'bg-rose-50 text-rose-600 dark:bg-rose-955/30 dark:text-rose-455';
                else if (log.action === 'LOGIN') badgeColor = 'bg-amber-50 text-amber-600 dark:bg-amber-955/30 dark:text-amber-400';

                return (
                  <div key={log.id || log.created_at} className="py-3.5 px-1 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-xs text-slate-700 dark:text-slate-350">{log.admin_name}</span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-505">{new Date(log.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{log.details}</p>
                    </div>
                    <span className={\`px-2 py-0.5 rounded-md text-[8px] font-extrabold \${badgeColor} uppercase tracking-wider\`}>
                      {log.action}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>`;

content = content.replace(targetJSX, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully reverted feeds from page.tsx!');
