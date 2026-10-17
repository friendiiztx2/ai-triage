export function exportChatsToCSV(filteredChats: any[], dateFilter: string) {
  if (!filteredChats || filteredChats.length === 0) return;

  const headers = [
    'Chat ID',
    'Customer ID',
    'Customer Name',
    'Category',
    'Priority',
    'Status',
    'AI Summary',
    'Tags',
    'Created At',
  ];

  const rows = filteredChats.map((c) => [
    `"${c.id || ''}"`,
    `"${c.customer_id || ''}"`,
    `"${(c.customer_name || '').replace(/"/g, '""')}"`,
    `"${(c.category_name || c.category_id || '').replace(/"/g, '""')}"`,
    `"${(c.priority || '').toUpperCase()}"`,
    `"${c.status || 'pending'}"`,
    `"${(c.summary || '').replace(/"/g, '""')}"`,
    `"${(c.tags || []).join(' ')}"`,
    `"${c.created_at || ''}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sift-ai-${dateFilter}-${new Date().toISOString().substring(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
