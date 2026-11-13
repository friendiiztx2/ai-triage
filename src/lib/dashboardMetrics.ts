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

const BANGKOK_TZ = 'Asia/Bangkok';

/** "YYYY-MM-DD" of a date in Thailand time (avoids UTC shifting chats from 00:00–06:59 to the previous day) */
function bangkokDateKey(d: Date): string {
  return d.toLocaleDateString('sv-SE', { timeZone: BANGKOK_TZ });
}

/** Hour of day (0–23) in Thailand time, regardless of the viewer's computer time zone */
function bangkokHour(d: Date): number {
  return parseInt(
    new Intl.DateTimeFormat('en-GB', { timeZone: BANGKOK_TZ, hour: '2-digit', hourCycle: 'h23' }).format(d),
    10
  );
}

/**
 * Category ids of every problem in a chat — the same rule as the category breakdown:
 * each chat_issue counts once; chats without issues fall back to their main category.
 */
function chatIssueCategoryIds(c: any): string[] {
  if (Array.isArray(c.chat_issues) && c.chat_issues.length > 0) {
    return c.chat_issues.map((issue: any) => issue.category_id || c.category_id || 'other');
  }
  return [c.category_id || 'other'];
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
    const now = Date.now();
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const key = bangkokDateKey(d);
      if (!dateMap.has(key)) sortedDateKeys.push(key);
      dateMap.set(key, d);
    }
  } else {
    filteredChats.forEach((c: any) => {
      if (c.created_at) {
        const d = new Date(c.created_at);
        const key = bangkokDateKey(d);
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
      ...filteredChats.flatMap((c: any) =>
        chatIssueCategoryIds(c)
          .filter((id) => getBaseCatId(id) !== 'other')
          .map((id) => getCategoryDisplayName(id, rawCategories, language))
      ),
    ])
  );

  if (isSingleDay) {
    // One point per hour (Thai time): a chat at 11:31 shows at "11:00 น."
    const hourlyLabels = Array.from({ length: 24 }, (_, h) => ({
      label: `${String(h).padStart(2, '0')}:00 น.`,
      start: h,
      end: h + 1,
    }));

    timeSeriesData = hourlyLabels.map((hl) => {
      const item: Record<string, any> = { name: hl.label };
      allCategoryNames.forEach((cn) => { item[cn] = 0; });
      const hourChats = filteredChats.filter((c: any) => {
        if (!c.created_at) return false;
        const h = bangkokHour(new Date(c.created_at));
        return h >= hl.start && h < hl.end;
      });

      // Count every problem in each chat (same rule as the category breakdown)
      hourChats.forEach((c: any) => {
        chatIssueCategoryIds(c).forEach((catId) => {
          if (getBaseCatId(catId) === 'other') return;
          const catName = getCategoryDisplayName(catId, rawCategories, language);
          item[catName] = (item[catName] || 0) + 1;
        });
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
        (c: any) => c.created_at && bangkokDateKey(new Date(c.created_at)) === key
      );

      // Count every problem in each chat (same rule as the category breakdown)
      dayChats.forEach((c: any) => {
        chatIssueCategoryIds(c).forEach((catId) => {
          if (getBaseCatId(catId) === 'other') return;
          const catName = getCategoryDisplayName(catId, rawCategories, language);
          item[catName] = (item[catName] || 0) + 1;
        });
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
