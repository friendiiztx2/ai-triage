import { getCategoryLabel } from './categories';

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
    `"${(getCategoryLabel(c.category_name || c.category_id, 'th')).replace(/"/g, '""')}"`,
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

export async function exportChatsToGoogleSheets(filteredChats: any[], dateFilter: string): Promise<boolean> {
  if (!filteredChats || filteredChats.length === 0) {
    alert('ไม่มีข้อมูลแชตที่สอดคล้องกับตัวกรอง');
    return false;
  }

  // 1. Batch fetch chat_issues for all chats if missing
  const issuesMap = new Map<string, any[]>();
  filteredChats.forEach((c) => {
    if (Array.isArray(c.chat_issues) && c.chat_issues.length > 0) {
      issuesMap.set(c.id, c.chat_issues);
    }
  });

  const missingIssueChatIds = filteredChats
    .filter((c) => !issuesMap.has(c.id))
    .map((c) => c.id)
    .filter(Boolean);

  if (missingIssueChatIds.length > 0) {
    try {
      for (let i = 0; i < missingIssueChatIds.length; i += 50) {
        const batchIds = missingIssueChatIds.slice(i, i + 50);
        const res = await fetch(`/api/chats/issues?chat_ids=${encodeURIComponent(batchIds.join(','))}`);
        if (res.ok) {
          const issuesData = await res.json();
          if (Array.isArray(issuesData)) {
            issuesData.forEach((iss: any) => {
              const list = issuesMap.get(iss.chat_id) || [];
              list.push(iss);
              issuesMap.set(iss.chat_id, list);
            });
          }
        }
      }
    } catch (e) {
      console.warn('Batch fetch chat_issues warning:', e);
    }
  }

  const dateLabel =
    dateFilter === 'today'
      ? 'ประจำวันนี้'
      : dateFilter === '7d' || dateFilter === '7days'
      ? 'ย้อนหลัง 7 วัน'
      : dateFilter === '30d' || dateFilter === '30days'
      ? 'ย้อนหลัง 30 วัน'
      : dateFilter === 'all'
      ? 'ทั้งหมด'
      : `ช่วง ${dateFilter}`;

  const nowFormatted = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });

  // 2. High-Fidelity HTML Table (Formatted for native Google Sheets paste)
  const rowsHtml = filteredChats
    .map((c, i) => {
      const customerId = c.customer_id || c.cust_id || '';
      const rawName = c.customer_name || c.name || `ลูกค้า #${customerId || (c.id || '').substring(0, 8)}`;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId);
      const custName = !customerId || isUuid ? rawName : `${rawName} (${customerId})`;

      const priority = (c.priority || 'low').toLowerCase();
      const priorityStyle =
        priority === 'urgent'
          ? 'background-color: #fce8e6; color: #c5221f; font-weight: bold;'
          : priority === 'high'
          ? 'background-color: #feefe3; color: #c26401; font-weight: bold;'
          : priority === 'medium'
          ? 'background-color: #e8f0fe; color: #1a73e8;'
          : 'background-color: #f1f3f4; color: #5f6368;';

      const statusText = c.status === 'completed' ? 'แยกแยะแล้ว' : 'รอดำเนินการ';
      const statusColor = c.status === 'completed' ? '#137333' : '#e37400';
      const timeFormatted = c.created_at
        ? new Date(c.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
        : '-';

      // Primary Category in Thai
      const catName = getCategoryLabel(c.category_name || c.category_id, 'th');
      const summary = c.summary || c.conversation || '-';

      // Multi-issue Classified Categories (The sub-issues AI triaged)
      const chatIssues = issuesMap.get(c.id) || [];
      const subIssueLabels = chatIssues.map((iss: any, idx: number) => {
        const catLabel = getCategoryLabel(iss.category_id, 'th');
        return `#${idx + 1} ${catLabel}`;
      });

      const subIssuesHtml =
        subIssueLabels.length > 0
          ? subIssueLabels
              .map(
                (lbl: string) =>
                  `<div style="margin-bottom: 2px; white-space: nowrap;"><strong style="color: #0f9d58;">${lbl.split(' ')[0]}</strong> ${lbl.split(' ').slice(1).join(' ')}</div>`
              )
              .join('')
          : `<div>${catName}</div>`;

      return `
      <tr style="border-bottom: 1px solid #dadce0; ${i % 2 === 1 ? 'background-color: #f8f9fa;' : 'background-color: #ffffff;'}">
        <td style="padding: 8px 10px; font-family: monospace; font-size: 11px; text-align: center; color: #5f6368;">${i + 1}</td>
        <td style="padding: 8px 10px; font-family: monospace; font-size: 11px; color: #1a73e8; font-weight: 500;">${c.id || '-'}</td>
        <td style="padding: 8px 10px; font-size: 12px; font-weight: 500; color: #202124;">${custName}</td>
        <td style="padding: 8px 10px; font-size: 12px; color: #3c4043; font-weight: 500;">${catName}</td>
        <td style="padding: 8px 10px; text-align: center;"><span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; ${priorityStyle}">${priority.toUpperCase()}</span></td>
        <td style="padding: 8px 10px; font-size: 12px; font-weight: 500; color: ${statusColor};">${statusText}</td>
        <td style="padding: 8px 10px; font-size: 12px; line-height: 1.4; color: #202124;">${summary}</td>
        <td style="padding: 8px 10px; font-size: 11px; color: #202124;">${subIssuesHtml}</td>
        <td style="padding: 8px 10px; font-size: 11px; color: #5f6368; white-space: nowrap;">${timeFormatted}</td>
      </tr>`;
    })
    .join('');

  const fullHtml = `
    <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; border: 1px solid #dadce0;">
      <thead>
        <tr style="background-color: #0f9d58; color: #ffffff; text-align: left;">
          <th style="padding: 10px; font-size: 11px; text-align: center; width: 45px; border-right: 1px solid rgba(255,255,255,0.2);">#</th>
          <th style="padding: 10px; font-size: 11px; width: 100px; border-right: 1px solid rgba(255,255,255,0.2);">รหัสแชต</th>
          <th style="padding: 10px; font-size: 11px; width: 150px; border-right: 1px solid rgba(255,255,255,0.2);">ลูกค้า</th>
          <th style="padding: 10px; font-size: 11px; width: 140px; border-right: 1px solid rgba(255,255,255,0.2);">หมวดหมู่หลัก</th>
          <th style="padding: 10px; font-size: 11px; text-align: center; width: 90px; border-right: 1px solid rgba(255,255,255,0.2);">ความด่วน</th>
          <th style="padding: 10px; font-size: 11px; width: 100px; border-right: 1px solid rgba(255,255,255,0.2);">สถานะ</th>
          <th style="padding: 10px; font-size: 11px; border-right: 1px solid rgba(255,255,255,0.2);">สรุปประเด็นปัญหา (AI Summary)</th>
          <th style="padding: 10px; font-size: 11px; width: 220px; border-right: 1px solid rgba(255,255,255,0.2);">ประเด็นที่ AI จำแนก (AI Sub-issues)</th>
          <th style="padding: 10px; font-size: 11px; width: 140px;">วันเวลา</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;

  // 3. TSV Format for Native Cell Separation in Google Sheets
  const plainTextHeaders = [
    '#',
    'รหัสแชต',
    'ลูกค้า',
    'หมวดหมู่หลัก',
    'ความด่วน',
    'สถานะ',
    'สรุปประเด็นปัญหา (AI Summary)',
    'ประเด็นที่ AI จำแนก (AI Sub-issues)',
    'วันเวลา',
  ];

  const plainTextRows = filteredChats.map((c, i) => {
    const customerId = c.customer_id || c.cust_id || '';
    const rawName = c.customer_name || c.name || `ลูกค้า #${customerId || (c.id || '').substring(0, 8)}`;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId);
    const custName = !customerId || isUuid ? rawName : `${rawName} (${customerId})`;

    const catName = getCategoryLabel(c.category_name || c.category_id, 'th');
    const chatIssues = issuesMap.get(c.id) || [];
    const subIssueLabels = chatIssues.map((iss: any, idx: number) => {
      const catLabel = getCategoryLabel(iss.category_id, 'th');
      return `#${idx + 1} ${catLabel}`;
    });
    const subIssuesText = subIssueLabels.length > 0 ? subIssueLabels.join(', ') : catName;

    return [
      i + 1,
      c.id || '',
      custName,
      catName,
      (c.priority || 'low').toUpperCase(),
      c.status === 'completed' ? 'แยกแยะแล้ว' : 'รอดำเนินการ',
      (c.summary || '').replace(/\t|\n/g, ' '),
      subIssuesText.replace(/\t|\n/g, ' '),
      c.created_at ? new Date(c.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : '',
    ].join('\t');
  });

  const plainText = [plainTextHeaders.join('\t'), ...plainTextRows].join('\n');

  // 4. Write Rich HTML & TSV to Clipboard
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
      const blobHtml = new Blob([fullHtml], { type: 'text/html' });
      const blobText = new Blob([plainText], { type: 'text/plain' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText,
        }),
      ]);
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(plainText);
    }
  } catch (clipErr) {
    console.warn('Clipboard write warning:', clipErr);
  }

  // 5. Open Google Sheets in New Tab
  if (typeof window !== 'undefined') {
    window.open('https://docs.google.com/spreadsheets/create', '_blank', 'noopener,noreferrer');
  }

  return true;
}
