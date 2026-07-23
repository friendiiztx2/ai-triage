const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove state refreshInterval
content = content.replace(
  `  // Auto-refresh setting\n  const [refreshInterval, setRefreshInterval] = useState('off');`,
  ''
);

// 2. Remove auto-refresh useEffect hook
const timerHook = `  // Auto-refresh handler effect
  useEffect(() => {
    if (refreshInterval === 'off') return;

    let seconds = 30;
    if (refreshInterval === '30s') seconds = 30;
    else if (refreshInterval === '1m') seconds = 60;
    else if (refreshInterval === '3m') seconds = 180;

    const intervalId = setInterval(() => {
      silentBackgroundReload();
    }, seconds * 1000);

    return () => clearInterval(intervalId);
  }, [refreshInterval, categories]);`;

content = content.replace(timerHook, '');

// 3. Remove JSX Auto Refresh Dropdown
const dropdownJSX = `          {/* Auto Refresh Dropdown */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl shadow-sm">
            <RefreshCw size={14} className={\`text-slate-400 \${refreshInterval !== \'off\' ? \'animate-spin text-indigo-500\' : \'\'}\`} />
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(e.target.value)}
              className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="off">{language === 'th' ? 'รีเฟรชออโต้: ปิด' : 'Auto Refresh: Off'}</option>
              <option value="30s">{language === 'th' ? 'รีเฟรชออโต้: ทุก 30 วิ' : 'Auto Refresh: 30s'}</option>
              <option value="1m">{language === 'th' ? 'รีเฟรชออโต้: ทุก 1 นาที' : 'Auto Refresh: 1 min'}</option>
              <option value="3m">{language === 'th' ? 'รีเฟรชออโต้: ทุก 3 นาที' : 'Auto Refresh: 3 min'}</option>
            </select>
          </div>`;

content = content.replace(dropdownJSX, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully removed auto refresh polling dropdown and codes!');
