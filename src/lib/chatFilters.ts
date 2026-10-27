import { getBaseCatId } from './categories';

export interface ChatFilterCriteria {
  searchQuery?: string;
  statusFilter?: string;
  priorityFilter?: string;
  categoryFilter?: string;
  tagFilter?: string;
  dateFilter?: string;
  startDate?: string;
  endDate?: string;
  auditFilter?: string;
}

export function chatHasImage(c: any): boolean {
  if (!c) return false;
  if (Array.isArray(c.media_urls) && c.media_urls.length > 0) return true;
  if (
    Array.isArray(c.tags) &&
    (c.tags.includes('#รูปภาพ') ||
      c.tags.includes('#รูปภาพล้วน') ||
      c.tags.includes('#รูปภาพทั้งหมด') ||
      c.tags.includes('#รูปภาพแนบ'))
  ) {
    return true;
  }
  const text = (typeof c.conversation === 'string' ? c.conversation : '') + ' ' + (typeof c.summary === 'string' ? c.summary : '');
  if (
    /(https?:\/\/[^\s\n"']+\.(jpg|jpeg|png|webp|gif|svg)(\?[^\s\n"']*)?)/i.test(text) ||
    /(https?:\/\/[^\s\n"']*(images|photos|slip|storage)[^\s\n"']*)/i.test(text) ||
    text.includes('[รูปภาพ]') ||
    text.includes('📷')
  ) {
    return true;
  }
  if (
    typeof c.summary === 'string' &&
    (c.summary.includes('รูปภาพล้วน') || c.summary.includes('ไม่ระบุข้อความพิมพ์'))
  ) {
    return true;
  }
  return false;
}

export function isImageOnlyChat(c: any): boolean {
  if (!c) return false;
  if (Array.isArray(c.tags) && c.tags.includes('#รูปภาพล้วน')) return true;
  if (
    typeof c.summary === 'string' &&
    (c.summary.includes('รูปภาพล้วน') || c.summary.includes('ไม่ระบุข้อความพิมพ์'))
  ) {
    return true;
  }
  const text = typeof c.conversation === 'string' ? c.conversation : '';
  const stripped = text
    .replace(/(https?:\/\/[^\s\n"']+)/gi, '')
    .replace(/\(📷[^\)]*\)/g, '')
    .replace(/📷[^\n]*/g, '')
    .replace(/ลูกค้า:/g, '')
    .replace(/แอดมิน:/g, '')
    .trim();
  if (!stripped && chatHasImage(c)) return true;
  return false;
}

export function isImageWithTextChat(c: any): boolean {
  return chatHasImage(c) && !isImageOnlyChat(c);
}

export function getChatAuditState(c: any): 'unverified' | 'confirmed' | 'corrected' {
  if (!c) return 'unverified';
  try {
    if (c.resolution && c.resolution !== 'Pending' && c.resolution !== 'Solved') {
      const parsed = JSON.parse(c.resolution);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const latest = parsed[0];
        if (
          latest &&
          (String(latest.actor || '').includes('อนุมัติตาม AI') ||
            (latest.old_category === latest.new_category &&
              latest.old_priority === latest.new_priority))
        ) {
          return 'confirmed';
        }
        return 'corrected';
      }
    }
  } catch (e) {}
  return 'unverified';
}

export function filterChats(chats: any[], criteria: ChatFilterCriteria): any[] {
  let result = chats;

  // Search
  if (criteria.searchQuery) {
    const q = criteria.searchQuery.toLowerCase().trim();
    result = result.filter((c) => {
      const nameMatch = c.customer_name?.toLowerCase().includes(q);
      const idMatch = c.id?.toLowerCase().includes(q) || c.customer_id?.toLowerCase().includes(q);
      const summaryMatch = (c.summary || c.problem_summary)?.toLowerCase().includes(q);
      const conversationMatch =
        typeof c.conversation === 'string'
          ? c.conversation.toLowerCase().includes(q)
          : JSON.stringify(c.conversation || '').toLowerCase().includes(q);
      const tagsMatch = c.tags?.some((t: string) => t.toLowerCase().includes(q));

      return nameMatch || idMatch || summaryMatch || conversationMatch || tagsMatch;
    });
  }

  // Status
  if (criteria.statusFilter && criteria.statusFilter !== 'all') {
    result = result.filter((c) => (c.status || 'pending') === criteria.statusFilter);
  }

  // Priority
  if (criteria.priorityFilter && criteria.priorityFilter !== 'all') {
    result = result.filter((c) => {
      const pri = c.priority?.toLowerCase() || 'low';
      const urg = (c.urgency || '').toLowerCase();
      let issueMatch = false;
      if (c.chat_issues && c.chat_issues.length > 0) {
        issueMatch = c.chat_issues.some((issue: any) => {
          const ipri = issue.priority?.toLowerCase();
          return ipri === criteria.priorityFilter;
        });
      }

      if (criteria.priorityFilter === 'urgent') {
        return pri === 'urgent' || pri === 'critical' || urg === 'urgent' || issueMatch;
      }
      return pri === criteria.priorityFilter || issueMatch;
    });
  }

  // Category
  if (criteria.categoryFilter && criteria.categoryFilter !== 'all') {
    const targetBase = getBaseCatId(criteria.categoryFilter);
    result = result.filter((c) => {
      if (c.chat_issues && c.chat_issues.length > 0) {
        return c.chat_issues.some(
          (issue: any) =>
            issue.category_id === criteria.categoryFilter ||
            getBaseCatId(issue.category_id) === targetBase
        );
      }
      return c.category_id === criteria.categoryFilter || getBaseCatId(c.category_id) === targetBase;
    });
  }

  // Tag
  if (criteria.tagFilter && criteria.tagFilter !== 'all') {
    if (
      criteria.tagFilter === '#รูปภาพ' ||
      criteria.tagFilter === '#รูปภาพทั้งหมด' ||
      criteria.tagFilter === 'has-image' ||
      criteria.tagFilter === 'image'
    ) {
      result = result.filter(chatHasImage);
    } else if (
      criteria.tagFilter === '#รูปภาพแนบ' ||
      criteria.tagFilter === '#รูปภาพพร้อมข้อความ' ||
      criteria.tagFilter === 'image-with-text'
    ) {
      result = result.filter(isImageWithTextChat);
    } else if (
      criteria.tagFilter === '#รูปภาพล้วน' ||
      criteria.tagFilter === 'image-only'
    ) {
      result = result.filter(isImageOnlyChat);
    } else {
      result = result.filter((c) => {
        const tags = c.tags || [];
        return tags.includes(criteria.tagFilter);
      });
    }
  }

  // Date
  const todayLocalStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });

  if (criteria.dateFilter === 'today') {
    result = result.filter((c) => {
      if (!c.created_at) return false;
      const itemDateStr = new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
      return itemDateStr === todayLocalStr;
    });
  } else if (criteria.dateFilter === '7days') {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffStr = cutoff.toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
    result = result.filter((c) => {
      if (!c.created_at) return false;
      const itemDateStr = new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
      return itemDateStr >= cutoffStr;
    });
  } else if (criteria.dateFilter === '30days') {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
    result = result.filter((c) => {
      if (!c.created_at) return false;
      const itemDateStr = new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
      return itemDateStr >= cutoffStr;
    });
  } else if (criteria.dateFilter === 'custom') {
    if (!criteria.startDate && !criteria.endDate) {
      return [];
    }
    if (criteria.startDate) {
      result = result.filter((c) => {
        if (!c.created_at) return false;
        const itemDateStr = new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
        return itemDateStr >= criteria.startDate!;
      });
    }
    if (criteria.endDate) {
      result = result.filter((c) => {
        if (!c.created_at) return false;
        const itemDateStr = new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
        return itemDateStr <= criteria.endDate!;
      });
    }
  }

  // Audit
  if (criteria.auditFilter && criteria.auditFilter !== 'all') {
    result = result.filter((c) => {
      const state = getChatAuditState(c);
      if (criteria.auditFilter === 'unverified') return state === 'unverified';
      if (criteria.auditFilter === 'confirmed') return state === 'confirmed';
      if (criteria.auditFilter === 'corrected') return state === 'corrected';
      return true;
    });
  }

  return result;
}
