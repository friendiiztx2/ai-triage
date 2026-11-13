/**
 * Builds the time-range part of a link into the chats page, so drill-downs from the
 * dashboard keep the same period the user is looking at.
 *
 * For a custom range ("custom") the start and end dates must travel with the link,
 * otherwise the chats page opens "custom" with empty dates and finds nothing.
 *
 * Returns a query fragment WITHOUT a leading "?" or "&", e.g.
 *   "timeframe=7days"
 *   "timeframe=custom&start=2026-10-01&end=2026-10-27"
 */
export function chatsTimeframeQuery(dateRange?: string, startDate?: string, endDate?: string): string {
  if (!dateRange) return '';
  const params = new URLSearchParams({ timeframe: dateRange });
  if (dateRange === 'custom') {
    if (startDate) params.set('start', startDate);
    if (endDate) params.set('end', endDate);
  }
  return params.toString();
}

/** Joins a chats-page path that may already have a query with an extra query fragment. */
export function withQuery(path: string, fragment: string): string {
  if (!fragment) return path;
  return path + (path.includes('?') ? '&' : '?') + fragment;
}
