const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'chats', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import Link
if (!content.includes("import Link from 'next/link';")) {
  content = content.replace(
    `import { useLanguage } from '@/components/LanguageContext';`,
    `import { useLanguage } from '@/components/LanguageContext';\nimport Link from 'next/link';`
  );
}

// 2. Add FileSpreadsheet to lucide-react imports
if (!content.includes('FileSpreadsheet')) {
  content = content.replace(
    `  CheckCircle, ArrowLeft, Download, Copy, Sparkles, BookOpen, Check, X, Minus\n} from 'lucide-react';`,
    `  CheckCircle, ArrowLeft, Download, Copy, Sparkles, BookOpen, Check, X, Minus,\n  FileSpreadsheet\n} from 'lucide-react';`
  );
}

// 3. Remove exportToCSV function
const functionStr = `  const exportToCSV = () => {
    if (filteredChats.length === 0) return;
    
    // Header
    const headers = ['Chat ID', 'Customer Name', 'Status', 'Priority', 'Category', 'AI Summary', 'Created At'];
    
    // Rows
    const rows = filteredChats.map(c => [
      c.id || '',
      c.customer_name || ('ลูกค้า #' + (c.customer_id || c.id?.substring(0, 8))),
      c.status || 'pending',
      c.priority || 'low',
      categories.find(cat => cat.id === c.category_id)?.name || c.category_id || 'อื่นๆ',
      (c.summary || '').replace(/\\r?\\n/g, ' ').replace(/"/g, '""'),
      c.created_at ? new Date(c.created_at).toLocaleString('th-TH') : '-'
    ]);

    // Create CSV content with UTF-8 BOM (\\uFEFF) to make Excel display Thai characters correctly
    const csvContent = '\\uFEFF' + [
      headers.join(','), 
      ...rows.map(e => e.map(val => '"' + (val || '') + '"').join(','))
    ].join('\\r\\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "chats_report_" + new Date().toISOString().split('T')[0] + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };`;

content = content.replace(functionStr, '');

// 4. Replace button with Link button
const targetButton = `        <button 
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-100 dark:shadow-none transition-all cursor-pointer self-start md:self-auto"
        >
          <Download size={16} /> {t('btnExportCsv')}
        </button>`;

const replacementLink = `        <Link 
          href="/reports"
          className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer self-start md:self-auto select-none"
        >
          <FileSpreadsheet size={14} className="text-indigo-600 dark:text-indigo-400" />
          {language === 'th' ? 'ไปหน้าส่งออกรายงาน ➡️' : 'Go to Export Center ➡️'}
        </Link>`;

content = content.replace(targetButton, replacementLink);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully replaced export button with link to Reports page!');
