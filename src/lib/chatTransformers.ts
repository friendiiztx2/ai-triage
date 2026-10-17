export function determineStatus(item: any): string {
  if (!item) return 'pending';
  const s = typeof item.status === 'string' ? item.status.trim().toLowerCase() : '';
  if (s) return s;
  return 'pending';
}

export function parseKeywords(keywords: any): string[] {
  if (Array.isArray(keywords)) {
    return keywords;
  }
  if (typeof keywords === 'string' && keywords.startsWith('[')) {
    try {
      return JSON.parse(keywords);
    } catch (e) {}
  }
  return [];
}

export function parseTags(row: any, convText: string): string[] {
  let parsedTags: string[] = [];
  if (Array.isArray(row.tags) && row.tags.length > 0) {
    parsedTags = [...row.tags];
  } else if (Array.isArray(row.keywords) && row.keywords.length > 0) {
    parsedTags = [...row.keywords];
  } else if (typeof row.keywords === 'string' && row.keywords.startsWith('[')) {
    try {
      parsedTags = JSON.parse(row.keywords);
    } catch (e) {}
  }

  const raw = (convText + ' ' + (row.summary || '')).toLowerCase();
  const isImg =
    raw.includes('photo-') ||
    raw.includes('images') ||
    raw.includes('slip') ||
    raw.includes('📷') ||
    raw.includes('.jpg') ||
    raw.includes('.png');

  if (isImg) {
    if (!parsedTags.includes('#รูปภาพ')) parsedTags.push('#รูปภาพ');
    const stripped = convText
      .replace(/(https?:\/\/[^\s\n"']+)/gi, '')
      .replace(/\(📷[^\)]*\)/g, '')
      .replace(/📷[^\n]*/g, '')
      .trim();
    if (!stripped && !parsedTags.includes('#รูปภาพล้วน')) {
      parsedTags.push('#รูปภาพล้วน');
    }
  }

  return Array.from(new Set(parsedTags));
}

export function transformChatRow(row: any) {
  let convText = row.conversation || row.summary || '';
  let rawMsgs: string[] = [];
  if (typeof convText === 'string') {
    rawMsgs = convText.split('\n').filter(Boolean);
  } else if (Array.isArray(convText)) {
    rawMsgs = convText;
    convText = convText.join('\n');
  }

  const detectedPri = (row.priority || (row.urgency === 'urgent' ? 'urgent' : 'low')).toLowerCase();
  const parsedTags = parseTags(row, convText);

  return {
    id: row.id,
    customer_id: row.customer_id || null,
    customer_name: row.customer_name || (row.customer_id ? `ลูกค้า #${row.customer_id}` : (row.id ? `ลูกค้า #${row.id.substring(0, 8)}` : 'ลูกค้าทั่วไป')),
    summary: row.summary || 'ไม่มีข้อมูลสรุป',
    conversation: convText,
    rawMessages: rawMsgs,
    category_id: row.category_id || null,
    priority: detectedPri,
    urgency: row.urgency || (detectedPri === 'urgent' ? 'urgent' : 'low'),
    resolution: row.resolution || 'Pending',
    status: determineStatus(row),
    confidence: row.confidence || 0,
    company_id: row.company_id || null,
    tags: parsedTags,
    created_at: row.created_at || new Date().toISOString(),
  };
}
