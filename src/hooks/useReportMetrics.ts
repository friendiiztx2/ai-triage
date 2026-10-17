'use client';

import { useMemo } from 'react';
import { filterChatsForReport } from '@/lib/reportExport';

interface FilterOptions {
  selectedCompanyFilter: string;
  selectedStatus: string;
  selectedPriority: string;
  selectedCategory: string;
  dateRange: string;
  startDate: string;
  endDate: string;
  isSystemAdmin: boolean;
}

export function useReportMetrics(
  chats: any[],
  reportType: 'overall' | 'finance' | 'marketing',
  filterOptions: FilterOptions
) {
  return useMemo(() => {
    const result = filterChatsForReport(chats, reportType, filterOptions);

    const filteredCount = result.length;
    const pendingCount = result.filter((c) => (c.status || 'pending') === 'pending').length;
    const completedCount = result.length - pendingCount;

    let urgentCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let depositCount = 0;
    let withdrawalCount = 0;
    let newCustomerCount = 0;
    let returningCustomerCount = 0;

    result.forEach((c) => {
      const p = c.priority?.toLowerCase() || 'low';
      if (p === 'urgent') urgentCount++;
      else if (p === 'high') highCount++;
      else if (p === 'medium') mediumCount++;
      else lowCount++;

      const raw = ((c.conversation || '') + ' ' + (c.summary || '') + ' ' + (c.category_id || '')).toLowerCase();
      if (raw.includes('ถอน')) withdrawalCount++;
      if (raw.includes('ฝาก') || raw.includes('โอน') || raw.includes('สลิป')) depositCount++;

      const customerId = c.customer_id || c.cust_id || '';
      const custName = c.customer_name || c.name || '';
      const historyCount = chats.filter(
        (item) =>
          (customerId && (item.customer_id === customerId || item.cust_id === customerId)) ||
          (custName && item.customer_name === custName) ||
          item.id === c.id
      ).length;

      if (historyCount === 1) newCustomerCount++;
      else returningCustomerCount++;
    });

    return {
      filteredCount,
      pendingCount,
      completedCount,
      urgentCount,
      highCount,
      mediumCount,
      lowCount,
      depositCount,
      withdrawalCount,
      newCustomerCount,
      returningCustomerCount,
    };
  }, [chats, reportType, filterOptions]);
}
