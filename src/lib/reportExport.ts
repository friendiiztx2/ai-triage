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
