import { getCategoryLabel, getBaseCatId } from './categories';

export function getCategoryDisplayName(
  rawCatId: string,
  rawCategories: any[],
  language: 'th' | 'en'
): string {
  const found = rawCategories.find(
    (c: any) => c.id === rawCatId || getBaseCatId(c.id) === getBaseCatId(rawCatId)
  );
  if (found) {
    return getCategoryLabel(found, language);
  }
  return getCategoryLabel(rawCatId, language);
}

export function calculateDashboardMetrics({
  filteredChats,
  rawCategories,
  categories,
  totalCustomersCount,
  language,
  dateRange,
  startDate,
  endDate,
}: {
  filteredChats: any[];
  rawCategories: any[];
  categories: Record<string, string>;
  totalCustomersCount: number;
  language: 'th' | 'en';
  dateRange: string;
  startDate: string;
  endDate: string;
}) {
  const total = filteredChats.length;
  const pending = filteredChats.filter((c: any) => (c.status || 'pending') === 'pending').length;

  const urgentCases = filteredChats.filter((c: any) => {
    const pri = (c.priority || '').toLowerCase();
    const urg = (c.urgency || '').toLowerCase();
    return pri === 'urgent' || pri === 'critical' || urg === 'urgent';
  }).length;

  const highCases = filteredChats.filter((c: any) => {
    const pri = (c.priority || '').toLowerCase();
    const urg = (c.urgency || '').toLowerCase();
    return (pri === 'high' || urg === 'high') && pri !== 'urgent' && urg !== 'urgent';
  }).length;

  const stats = {
    totalChats: total,
    pendingTriage: pending,
    highPriority: urgentCases,
    highOnlyCount: highCases,
    totalCustomers: totalCustomersCount,
  };

  // AI Accuracy
  const completedChats = filteredChats.filter((c: any) => c.status === 'completed');
  let confirmed = 0;
  let corrected = 0;

  completedChats.forEach((c: any) => {
    let isCorrect = true;
    try {
      if (c.resolution) {
        const history = JSON.parse(c.resolution);
        if (Array.isArray(history)) {
          const hasOverride = history.some(
            (log: any) =>
              log.old_category !== log.new_category || log.old_priority !== log.new_priority
          );
          if (hasOverride) isCorrect = false;
        }
      }
    } catch (e) {}

    if (isCorrect) confirmed++;
    else corrected++;
  });

  const totalAudited = completedChats.length;
  const accuracyRate =
    totalAudited > 0 ? ((confirmed / totalAudited) * 100).toFixed(1) : '100.0';

  const aiMetrics = {
    accuracyRate,
    totalAudited,
    confirmedCount: confirmed,
    correctedCount: corrected,
  };

  // Category counts
  const catCounts: Record<string, number> = {};
  let otherCount = 0;

  filteredChats.forEach((c: any) => {
    if (c.chat_issues && c.chat_issues.length > 0) {
      c.chat_issues.forEach((issue: any) => {
        const rawCatId = issue.category_id || c.category_id || 'other';
        const baseKey = getBaseCatId(rawCatId);
        if (rawCatId === 'other' || baseKey === 'other') {
          otherCount++;
        } else {
          const catName = getCategoryDisplayName(rawCatId, rawCategories, language);
          catCounts[catName] = (catCounts[catName] || 0) + 1;
        }
      });
    } else {
      const rawCatId = c.category_id || 'other';
      const baseKey = getBaseCatId(rawCatId);
      if (rawCatId === 'other' || baseKey === 'other') {
        otherCount++;
      } else {
        const catName = getCategoryDisplayName(rawCatId, rawCategories, language);
        catCounts[catName] = (catCounts[catName] || 0) + 1;
      }
    }
  });

  const chartData = Object.entries(catCounts).map(([name, value]) => {
    const found = rawCategories.find((c: any) => getCategoryLabel(c, language) === name);
    const catId = found
      ? getBaseCatId(found.id)
      : Object.entries(categories).find(([_, display]) => display === name)?.[0] || 'other';
    return { name, value, id: catId };
  });

  // Time series
  let sortedDateKeys: string[] = [];
  const dateMap = new Map<string, Date>();

  if (dateRange === '7days' || dateRange === '30days') {
    const numDays = dateRange === '7days' ? 7 : 30;
    const today = new Date();
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().substring(0, 10);
      sortedDateKeys.push(key);
      dateMap.set(key, d);
    }
  } else {
    filteredChats.forEach((c: any) => {
      if (c.created_at) {
        const d = new Date(c.created_at);
        const key = d.toISOString().substring(0, 10);
        dateMap.set(key, d);
      }
    });
    sortedDateKeys = Array.from(dateMap.keys()).sort();
  }

  const isSingleDay = dateRange === 'today' || (dateRange === 'custom' && startDate === endDate);
  let timeSeriesData: any[] = [];

  // Pre-calculate all category names to initialize every point with 0 (prevents line gaps)
  const allCategoryNames = Array.from(
    new Set([
      ...rawCategories.map((c: any) => getCategoryDisplayName(c.id, rawCategories, language)),
      ...filteredChats.map((c: any) => getCategoryDisplayName(c.category_id || 'other', rawCategories, language)),
    ])
  );

  if (isSingleDay) {
    const hourlyLabels = [
      { label: '00:00 น.', start: 0, end: 4 },
      { label: '04:00 น.', start: 4, end: 8 },
      { label: '08:00 น.', start: 8, end: 12 },
      { label: '12:00 น.', start: 12, end: 16 },
      { label: '16:00 น.', start: 16, end: 20 },
      { label: '20:00 น.', start: 20, end: 24 },
    ];

    timeSeriesData = hourlyLabels.map((hl) => {
      const item: Record<string, any> = { name: hl.label };
      allCategoryNames.forEach((cn) => { item[cn] = 0; });
      const hourChats = filteredChats.filter((c: any) => {
        if (!c.created_at) return false;
        const h = new Date(c.created_at).getHours();
        return h >= hl.start && h < hl.end;
      });

      hourChats.forEach((c: any) => {
        const catId = c.category_id || 'other';
        const catName = getCategoryDisplayName(catId, rawCategories, language);
        item[catName] = (item[catName] || 0) + 1;
      });

      return item;
    });
  } else {
    timeSeriesData = sortedDateKeys.map((key) => {
      const d = dateMap.get(key) || new Date(key);
      const dateLabel = d.toLocaleDateString(language === 'en' ? 'en-US' : 'th-TH', {
        day: 'numeric',
        month: 'short',
      });
      const item: Record<string, any> = { name: dateLabel };
      allCategoryNames.forEach((cn) => { item[cn] = 0; });
      const dayChats = filteredChats.filter(
        (c: any) => c.created_at && c.created_at.substring(0, 10) === key
      );

      dayChats.forEach((c: any) => {
        const catId = c.category_id || 'other';
        const catName = getCategoryDisplayName(catId, rawCategories, language);
        item[catName] = (item[catName] || 0) + 1;
      });

      return item;
    });
  }

  // Priority Data
  let uCount = 0, hCount = 0, mCount = 0, lCount = 0;
  filteredChats.forEach((c: any) => {
    const pri = (c.priority || 'low').toLowerCase();
    if (pri === 'urgent' || pri === 'critical') uCount++;
    else if (pri === 'high') hCount++;
    else if (pri === 'medium') mCount++;
    else lCount++;
  });

  const priorityData = [
    { name: 'Urgent', count: uCount },
    { name: 'High', count: hCount },
    { name: 'Medium', count: mCount },
    { name: 'Low', count: lCount },
  ];

  return {
    stats,
    aiMetrics,
    chartData,
    timeSeriesData,
    priorityData,
    otherCount,
  };
}
