// Display labels for chat priorities, shared by badges, charts and reports.
export type PriorityKey = 'urgent' | 'high' | 'medium' | 'low';

const LABELS: Record<PriorityKey, { th: string; en: string }> = {
  urgent: { th: 'ด่วนวิกฤต', en: 'Urgent' },
  high: { th: 'ด่วนสูง', en: 'High' },
  medium: { th: 'ปานกลาง', en: 'Medium' },
  low: { th: 'ปกติ', en: 'Low' },
};

/** Label for a priority value in any casing ("Urgent", "urgent"); unknown values are returned unchanged. */
export function priorityLabel(priority: string | null | undefined, language: 'th' | 'en' = 'th'): string {
  const key = (priority || 'low').toLowerCase() as PriorityKey;
  return LABELS[key]?.[language] ?? String(priority ?? '');
}
