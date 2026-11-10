import { getCategoryLabel } from './categories';
import * as XLSX from 'xlsx';

export function extractBankProvider(text: string): string {
  const raw = text.toLowerCase();
  if (raw.includes('กสิกร') || raw.includes('kbank')) return 'ธนาคารกสิกรไทย (KBANK)';
  if (raw.includes('ไทยพาณิชย์') || raw.includes('scb')) return 'ธนาคารไทยพาณิชย์ (SCB)';
  if (raw.includes('กรุงเทพ') || raw.includes('bbl')) return 'ธนาคารกรุงเทพ (BBL)';
  if (raw.includes('กรุงไทย') || raw.includes('ktb')) return 'ธนาคารกรุงไทย (KTB)';
  if (raw.includes('ทรูวอลเล็ท') || raw.includes('truemoney') || raw.includes('true wallet')) return 'TrueMoney Wallet';
  if (raw.includes('พร้อมเพย์') || raw.includes('promptpay')) return 'ระบบพร้อมเพย์ (PromptPay)';
  return 'ระบบเพย์เมนต์หลัก / ธนาคารพานิชย์';
}

export function extractAmount(text: string): string {
  const match = text.match(/(\d[\d,]*\b)\s*(บาท|baht|฿)?/i);
  if (match && match[1] && parseInt(match[1].replace(/,/g, ''), 10) > 10) {
    return `${match[1]} บาท`;
  }
  return 'ไม่ระบุยอดเงิน';
}

export function filterChatsForReport(
  sourceChats: any[],
  targetType: 'overall' | 'finance' | 'marketing',
  options: {
    selectedCompanyFilter?: string;
    selectedStatus?: string;
    selectedPriority?: string;
    selectedCategory?: string;
    dateRange?: string;
    startDate?: string;
    endDate?: string;
    isSystemAdmin?: boolean;
  }
): any[] {
  let result = sourceChats;

  if (options.isSystemAdmin && options.selectedCompanyFilter && options.selectedCompanyFilter !== 'all') {
    result = result.filter((c) => c.company_id === options.selectedCompanyFilter);
  }
  if (options.selectedStatus && options.selectedStatus !== 'all') {
    result = result.filter((c) => (c.status || 'pending') === options.selectedStatus);
  }
  if (options.selectedPriority && options.selectedPriority !== 'all') {
    result = result.filter((c) => (c.priority?.toLowerCase() || 'low') === options.selectedPriority);
  }

  // Type specific filter
  if (targetType === 'finance') {
    result = result.filter((c) => {
      const raw = ((c.conversation || '') + ' ' + (c.summary || '') + ' ' + (c.category_id || '')).toLowerCase();
      return (
        raw.includes('ฝาก') ||
        raw.includes('ถอน') ||
        raw.includes('โอน') ||
        raw.includes('สลิป') ||
        raw.includes('ยอดไม่เข้า') ||
        c.category_id === 'deposit_withdrawal'
      );
    });
  } else if (targetType === 'marketing') {
    result = result.filter((c) => {
      const customerId = c.customer_id || c.cust_id || '';
      const custName = c.customer_name || c.name || '';
      const historyCount = sourceChats.filter(
        (item) =>
          (customerId && (item.customer_id === customerId || item.cust_id === customerId)) ||
          (custName && item.customer_name === custName) ||
          item.id === c.id
      ).length;
      const tags = c.tags || [];
      const raw = ((c.conversation || '') + ' ' + (c.summary || '') + ' ' + (c.category_id || '')).toLowerCase();

      return (
        historyCount === 1 ||
        tags.includes('#VIP') ||
        raw.includes('โปร') ||
        raw.includes('โบนัส') ||
        raw.includes('เครดิตฟรี') ||
        c.category_id === 'promo_bonus'
      );
    });
  }

  if (options.selectedCategory && options.selectedCategory !== 'all') {
    result = result.filter((c) => {
      if (c.chat_issues && c.chat_issues.length > 0) {
        return c.chat_issues.some((issue: any) => issue.category_id === options.selectedCategory);
      }
      return c.category_id === options.selectedCategory || c.category === options.selectedCategory;
    });
  }

  // Date range filter
  const todayLocalStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });

  if (options.dateRange === 'today') {
    result = result.filter((c) => {
      if (!c.created_at) return false;
      const itemDateStr = new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
      return itemDateStr === todayLocalStr;
    });
  } else if (options.dateRange === '7days') {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffStr = cutoff.toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
    result = result.filter((c) => {
      if (!c.created_at) return false;
      const itemDateStr = new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
      return itemDateStr >= cutoffStr;
    });
  } else if (options.dateRange === '30days') {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
    result = result.filter((c) => {
      if (!c.created_at) return false;
      const itemDateStr = new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
      return itemDateStr >= cutoffStr;
    });
  } else if (options.dateRange === 'custom') {
    if (options.startDate) {
      result = result.filter((c) => {
        if (!c.created_at) return false;
        const itemDateStr = new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
        return itemDateStr >= options.startDate!;
      });
    }
    if (options.endDate) {
      result = result.filter((c) => {
        if (!c.created_at) return false;
        const itemDateStr = new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
        return itemDateStr <= options.endDate!;
      });
    }
  }

  return result;
}

export function exportMultiSheetXLSX(
  chats: any[],
  filterOptions: any,
  dateRange: string,
  userProfile: any
): { filename: string; size: string } | null {
  const overallData = filterChatsForReport(chats, 'overall', filterOptions);
  const financeData = filterChatsForReport(chats, 'finance', filterOptions);
  const marketingData = filterChatsForReport(chats, 'marketing', filterOptions);

  if (overallData.length === 0 && financeData.length === 0 && marketingData.length === 0) {
    return null;
  }

  const workbook = XLSX.utils.book_new();

  // Sheet 1: Overall
  const overallRows = overallData.map((c) => {
    const customerId = c.customer_id || c.cust_id || '';
    const custName = c.customer_name || c.name || `ลูกค้า #${customerId || (c.id || '').substring(0, 8)}`;
    const formattedDate = c.created_at ? new Date(c.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : '';
    return {
      'รหัสแชต (Chat ID)': c.id || '',
      'รหัสลูกค้า (Customer ID)': customerId,
      'ชื่อลูกค้า (Customer Name)': custName,
      'หมวดหมู่ปัญหา': c.category_name || c.category_id || 'ทั่วไป',
      'ระดับความด่วน': (c.priority || 'low').toUpperCase(),
      'สถานะการดำเนินการ': c.status === 'completed' ? 'แยกแยะแล้ว (Completed)' : 'รอดำเนินการ (Pending)',
      'ข้อสรุปปัญหา (AI Summary)': c.summary || '',
      'ป้ายกำกับ (Tags)': (c.tags || []).join(' '),
      'วันเวลาที่เกิดรายการ': formattedDate,
    };
  });
  const wsOverall = XLSX.utils.json_to_sheet(overallRows.length > 0 ? overallRows : [{ 'สถานะ': 'ไม่มีข้อมูลในหมวดนี้' }]);
  XLSX.utils.book_append_sheet(workbook, wsOverall, 'ภาพรวมระบบ (Overall)');

  // Sheet 2: Finance
  const financeRows = financeData.map((c) => {
    const raw = ((c.conversation || '') + ' ' + (c.summary || '') + ' ' + (c.category_id || '')).toLowerCase();
    let finType = 'รายการทั่วไป';
    if (raw.includes('ถอน')) finType = '💸 รายการถอนเงิน (Withdrawal)';
    else if (raw.includes('ฝาก') || raw.includes('โอน')) finType = '💵 รายการฝากเงิน (Deposit)';
    else if (raw.includes('สลิป') || raw.includes('ยอดไม่เข้า')) finType = '💳 ตรวจสอบสลิปโอนเงิน';

    const bank = extractBankProvider(c.conversation || c.summary || '');
    const amount = extractAmount(c.conversation || c.summary || '');
    const customerId = c.customer_id || c.cust_id || '';
    const custName = c.customer_name || c.name || `ลูกค้า #${customerId || (c.id || '').substring(0, 8)}`;
    const formattedDate = c.created_at ? new Date(c.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : '';

    return {
      'รหัสแชต (Chat ID)': c.id || '',
      'รหัสลูกค้า (Customer ID)': customerId,
      'ชื่อลูกค้า (Customer Name)': custName,
      'ประเภทรายการการเงิน': finType,
      'ระบบเพย์เมนต์ / บัญชีธนาคาร': bank,
      'ยอดเงินในสลิป/เพย์เมนต์': amount,
      'ความด่วนทางการเงิน': (c.priority || 'low').toUpperCase(),
      'สถานะการเคลียร์ยอด': c.status === 'completed' ? 'แยกแยะแล้ว (Completed)' : 'รอดำเนินการ (Pending)',
      'รายละเอียดปัญหาธุรกรรม': c.summary || '',
      'วันเวลาที่เกิดรายการ': formattedDate,
    };
  });
  const wsFinance = XLSX.utils.json_to_sheet(financeRows.length > 0 ? financeRows : [{ 'สถานะ': 'ไม่มีรายการการเงินในช่วงนี้' }]);
  XLSX.utils.book_append_sheet(workbook, wsFinance, 'รายงานการเงิน (Finance)');

  // Sheet 3: Marketing
  const marketingRows = marketingData.map((c) => {
    const customerId = c.customer_id || c.cust_id || '';
    const custName = c.customer_name || c.name || `ลูกค้า #${customerId || (c.id || '').substring(0, 8)}`;
    const historyCount = chats.filter(
      (item) =>
        (customerId && (item.customer_id === customerId || item.cust_id === customerId)) ||
        (custName && item.customer_name === custName) ||
        item.id === c.id
    ).length;

    const isNewCustomer = historyCount === 1;
    const formattedDate = c.created_at ? new Date(c.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : '';
    const tags = c.tags || [];

    return {
      'รหัสแชต (Chat ID)': c.id || '',
      'รหัสลูกค้า (Customer ID)': customerId,
      'ชื่อลูกค้า (Customer Name)': custName,
      'ประเภทลูกค้า (Customer Status)': isNewCustomer ? '✨ ลูกค้าใหม่ทักครั้งแรก' : '🔁 ลูกค้าเดิมทักซ้ำ',
      'วันเวลาที่ลูกค้าทักเข้ามา': formattedDate,
      'ประเด็นแรกที่ลูกค้าทักถาม': c.summary || '',
      'ป้ายกำกับแคมเปญ / VIP': tags.join(' '),
      'สถานะการดูแลลูกค้า': c.status === 'completed' ? 'ดูแลเรียบร้อย (Completed)' : 'รอดำเนินการ (Pending)',
    };
  });
  const wsMarketing = XLSX.utils.json_to_sheet(marketingRows.length > 0 ? marketingRows : [{ 'สถานะ': 'ไม่มีรายการการตลาดในช่วงนี้' }]);
  XLSX.utils.book_append_sheet(workbook, wsMarketing, 'รายงานการตลาด (Marketing)');

  const formattedDate = new Date().toISOString().split('T')[0];
  const filename = `Sift_AI_Master_Report_${dateRange}_${formattedDate}.xlsx`;
  XLSX.writeFile(workbook, filename);

  return { filename, size: '28.5 KB' };
}

export function exportSingleCSV(
  chats: any[],
  targetType: 'overall' | 'finance' | 'marketing',
  filterOptions: any,
  dateRange: string
): { filename: string; size: string } | null {
  const result = filterChatsForReport(chats, targetType, filterOptions);

  if (result.length === 0) return null;

  let csvHeaders: string[] = [];
  let rows: any[] = [];
  let filePrefix = 'Sift_AI_Overall_Report';

  if (targetType === 'finance') {
    filePrefix = 'Sift_AI_Finance_Report';
    csvHeaders = [
      'Chat ID', 'Customer ID', 'Customer Name', 'Transaction Type',
      'Payment Method', 'Detected Amount', 'Priority', 'Status', 'Summary', 'Created At'
    ];
    rows = result.map((c) => {
      const raw = ((c.conversation || '') + ' ' + (c.summary || '') + ' ' + (c.category_id || '')).toLowerCase();
      let finType = 'รายการทั่วไป';
      if (raw.includes('ถอน')) finType = 'ถอนเงิน (Withdrawal)';
      else if (raw.includes('ฝาก') || raw.includes('โอน')) finType = 'ฝากเงิน / โอนเงิน (Deposit)';
      else if (raw.includes('สลิป') || raw.includes('ยอดไม่เข้า')) finType = 'ตรวจสอบสลิป (Slip Verification)';

      return [
        c.id || '',
        c.customer_id || '',
        c.customer_name || '',
        finType,
        extractBankProvider(c.conversation || c.summary || ''),
        extractAmount(c.conversation || c.summary || ''),
        c.priority || 'low',
        c.status || 'pending',
        c.summary || '',
        c.created_at || '',
      ];
    });
  } else if (targetType === 'marketing') {
    filePrefix = 'Sift_AI_Marketing_Report';
    csvHeaders = [
      'Chat ID', 'Customer ID', 'Customer Name', 'Customer Status',
      'First Inquiry', 'Tags', 'Status', 'Created At'
    ];
    rows = result.map((c) => {
      const customerId = c.customer_id || c.cust_id || '';
      const custName = c.customer_name || c.name || '';
      const historyCount = chats.filter(
        (item) =>
          (customerId && (item.customer_id === customerId || item.cust_id === customerId)) ||
          (custName && item.customer_name === custName) ||
          item.id === c.id
      ).length;

      return [
        c.id || '',
        customerId,
        custName,
        historyCount === 1 ? 'New Customer' : 'Returning Customer',
        c.summary || '',
        (c.tags || []).join(' '),
        c.status || 'pending',
        c.created_at || '',
      ];
    });
  } else {
    csvHeaders = [
      'Chat ID', 'Customer ID', 'Customer Name', 'Category',
      'Priority', 'Status', 'AI Summary', 'Tags', 'Created At'
    ];
    rows = result.map((c) => [
      c.id || '',
      c.customer_id || '',
      c.customer_name || '',
      c.category_name || c.category_id || 'General',
      c.priority || 'low',
      c.status || 'pending',
      c.summary || '',
      (c.tags || []).join(' '),
      c.created_at || '',
    ]);
  }

  // BOM for UTF-8 support in Excel
  const bom = '\uFEFF';
  const csvContent =
    bom +
    [csvHeaders.join(','), ...rows.map((row) => row.map((cell: any) => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const formattedDate = new Date().toISOString().split('T')[0];
  const filename = `${filePrefix}_${dateRange}_${formattedDate}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return { filename, size: `${Math.round(blob.size / 1024)} KB` };
}

export async function exportToGoogleSheets(
  chats: any[],
  targetType: 'overall' | 'finance' | 'marketing',
  filterOptions: any,
  dateRange: string,
  userProfile?: any,
  language: string = 'th'
): Promise<{ filename: string; size: string; openUrl: string; rowCount: number } | null> {
  const result = filterChatsForReport(chats, targetType, filterOptions);
  if (result.length === 0) return null;
  const isEn = language === 'en';

  // 1. Batch fetch chat_issues for all chats if missing
  const issuesMap = new Map<string, any[]>();
  result.forEach((c) => {
    if (Array.isArray(c.chat_issues) && c.chat_issues.length > 0) {
      issuesMap.set(c.id, c.chat_issues);
    }
  });

  const missingIssueChatIds = result
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

  const reportTitle = isEn
    ? (targetType === 'finance'
        ? 'Financial & Payment Transactions Report'
        : targetType === 'marketing'
        ? 'Marketing & Customer Acquisition Report'
        : 'Executive System Overview & Chat Triage Report')
    : (targetType === 'finance'
        ? 'รายงานธุรกรรมการเงินและการชำระเงิน'
        : targetType === 'marketing'
        ? 'รายงานการตลาดและลูกค้าใหม่'
        : 'รายงานภาพรวมระบบและสถิติปัญหาแชต');

  const nowFormatted = new Date().toLocaleString(isEn ? 'en-US' : 'th-TH', { timeZone: 'Asia/Bangkok' });

  // 2. High-Fidelity HTML Table
  const rowsHtml = result
    .map((c, i) => {
      const customerId = c.customer_id || c.cust_id || '';
      const defaultCustName = isEn ? `Customer #${customerId || (c.id || '').substring(0, 8)}` : `ลูกค้า #${customerId || (c.id || '').substring(0, 8)}`;
      const rawName = c.customer_name || c.name || defaultCustName;
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

      const statusText = isEn
        ? (c.status === 'completed' ? 'Completed' : 'Pending')
        : (c.status === 'completed' ? 'แยกแยะแล้ว' : 'รอดำเนินการ');
      const statusColor = c.status === 'completed' ? '#137333' : '#e37400';

      const timeFormatted = c.created_at
        ? new Date(c.created_at).toLocaleString(isEn ? 'en-US' : 'th-TH', { timeZone: 'Asia/Bangkok' })
        : '-';

      const catName = getCategoryLabel(c.category_name || c.category_id, isEn ? 'en' : 'th');
      const summary = c.summary || c.conversation || '-';

      // Multi-issue Classified Categories
      const chatIssues = issuesMap.get(c.id) || [];
      const subIssueLabels = chatIssues.map((iss: any, idx: number) => {
        const catLabel = getCategoryLabel(iss.category_id, isEn ? 'en' : 'th');
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

  const tableHeadersTh = isEn
    ? ['#', 'Chat ID', 'Customer', 'Primary Category', 'Priority', 'Status', 'AI Summary', 'Identified Sub-issues (AI)', 'Date & Time']
    : ['#', 'รหัสแชต', 'ลูกค้า', 'หมวดหมู่หลัก', 'ความด่วน', 'สถานะ', 'สรุปประเด็นปัญหา (AI Summary)', 'ประเด็นที่ AI จำแนก (AI Sub-issues)', 'วันเวลา'];

  const fullHtml = `
    <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; border: 1px solid #dadce0;">
      <thead>
        <tr style="background-color: #0f9d58; color: #ffffff; text-align: left;">
          <th style="padding: 10px; font-size: 11px; text-align: center; width: 45px; border-right: 1px solid rgba(255,255,255,0.2);">${tableHeadersTh[0]}</th>
          <th style="padding: 10px; font-size: 11px; width: 100px; border-right: 1px solid rgba(255,255,255,0.2);">${tableHeadersTh[1]}</th>
          <th style="padding: 10px; font-size: 11px; width: 150px; border-right: 1px solid rgba(255,255,255,0.2);">${tableHeadersTh[2]}</th>
          <th style="padding: 10px; font-size: 11px; width: 150px; border-right: 1px solid rgba(255,255,255,0.2);">${tableHeadersTh[3]}</th>
          <th style="padding: 10px; font-size: 11px; text-align: center; width: 90px; border-right: 1px solid rgba(255,255,255,0.2);">${tableHeadersTh[4]}</th>
          <th style="padding: 10px; font-size: 11px; width: 100px; border-right: 1px solid rgba(255,255,255,0.2);">${tableHeadersTh[5]}</th>
          <th style="padding: 10px; font-size: 11px; border-right: 1px solid rgba(255,255,255,0.2);">${tableHeadersTh[6]}</th>
          <th style="padding: 10px; font-size: 11px; width: 220px; border-right: 1px solid rgba(255,255,255,0.2);">${tableHeadersTh[7]}</th>
          <th style="padding: 10px; font-size: 11px; width: 140px;">${tableHeadersTh[8]}</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;

  // 3. TSV Format
  const plainTextHeaders = tableHeadersTh;

  const plainTextRows = result.map((c, i) => {
    const customerId = c.customer_id || c.cust_id || '';
    const defaultCustName = isEn ? `Customer #${customerId || (c.id || '').substring(0, 8)}` : `ลูกค้า #${customerId || (c.id || '').substring(0, 8)}`;
    const rawName = c.customer_name || c.name || defaultCustName;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId);
    const custName = !customerId || isUuid ? rawName : `${rawName} (${customerId})`;

    const catName = getCategoryLabel(c.category_name || c.category_id, isEn ? 'en' : 'th');
    const statusText = isEn
      ? (c.status === 'completed' ? 'Completed' : 'Pending')
      : (c.status === 'completed' ? 'แยกแยะแล้ว' : 'รอดำเนินการ');

    const chatIssues = issuesMap.get(c.id) || [];
    const subIssueLabels = chatIssues.map((iss: any, idx: number) => {
      const catLabel = getCategoryLabel(iss.category_id, isEn ? 'en' : 'th');
      return `#${idx + 1} ${catLabel}`;
    });
    const subIssuesText = subIssueLabels.length > 0 ? subIssueLabels.join(', ') : catName;

    const timeFormatted = c.created_at
      ? new Date(c.created_at).toLocaleString(isEn ? 'en-US' : 'th-TH', { timeZone: 'Asia/Bangkok' })
      : '';

    return [
      i + 1,
      c.id || '',
      custName,
      catName,
      (c.priority || 'low').toUpperCase(),
      statusText,
      (c.summary || '').replace(/\t|\n/g, ' '),
      subIssuesText.replace(/\t|\n/g, ' '),
      timeFormatted,
    ].join('\t');
  });

  const plainText = [plainTextHeaders.join('\t'), ...plainTextRows].join('\n');

  // 4. Write to Clipboard
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

  // 5. Open Google Sheets
  const openUrl = 'https://docs.google.com/spreadsheets/create';
  if (typeof window !== 'undefined') {
    window.open(openUrl, '_blank', 'noopener,noreferrer');
  }

  const formattedDate = new Date().toISOString().split('T')[0];
  const filename = `Sift_AI_${targetType}_GoogleSheets_${formattedDate}`;
  const size = `${(fullHtml.length / 1024).toFixed(1)} KB`;

  return { filename, size, openUrl, rowCount: result.length };
}

export const exportToGoogleDocs = exportToGoogleSheets;

