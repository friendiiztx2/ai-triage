const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import statement
if (!content.includes("import { supabase }")) {
  content = content.replace(
    `import { useLanguage } from '@/components/LanguageContext';`,
    `import { useLanguage } from '@/components/LanguageContext';\nimport { supabase } from '@/lib/supabase';`
  );
}

// 2. Add realtime useEffect hook
const realtimeHook = `  // Realtime Supabase changes listener
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-realtime-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chats' },
        () => {
          silentBackgroundReload();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_issues' },
        () => {
          silentBackgroundReload();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);`;

// Let's insert the realtimeHook right after loadDashboardData / silentBackgroundReload or the initial mount useEffect.
const targetInsertAfter = `  useEffect(() => {
    loadDashboardData();
  }, []);`;

content = content.replace(
  targetInsertAfter,
  `${targetInsertAfter}\n\n${realtimeHook}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched page.tsx with Supabase Realtime listener!');
