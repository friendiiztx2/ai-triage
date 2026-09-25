export interface Category {
  id: string;
  name: string;
  name_th?: string;
  name_en?: string;
  description?: string;
  company_id?: string;
  [key: string]: any;
}

export const KNOWN_CATEGORY_NAMES: Record<string, { th: string; en: string }> = {
  deposit_withdrawal: { th: 'การเงินและการชำระเงิน', en: 'Deposit & Withdrawal' },
  page_load_freeze: { th: 'หน้าเว็บค้าง/โหลดช้า', en: 'Page Load / Freeze' },
  ui_rendering_issue: { th: 'ปัญหากราฟิก/การแสดงผลเว็บ', en: 'UI Rendering Issue' },
  login_issue: { th: 'ปัญหาระบบเข้าใช้งาน/ล็อกอิน', en: 'Login Issue' },
  access_blocked: { th: 'เข้าหน้าเว็บไม่ได้/ลิงก์เสีย', en: 'Access Blocked' },
  promo_bonus: { th: 'โปรโมชั่นและโบนัส', en: 'Promo & Bonus' },
  game_issue: { th: 'ปัญหาเกี่ยวกับตัวเกม', en: 'Game Issue' },
  gameplay_issue: { th: 'ปัญหาเกี่ยวกับตัวเกม', en: 'Game Issue' },
  account_security: { th: 'ความปลอดภัยของบัญชี', en: 'Account Security' },
  api_error: { th: 'ข้อผิดพลาดระบบ API', en: 'API Error' },
  payment_gateway: { th: 'ระบบการชำระเงิน/ธนาคาร', en: 'Payment Gateway' },
  notification_issue: { th: 'ปัญหาการแจ้งเตือน', en: 'Notification Issue' },
  interaction_lag: { th: 'ระบบการทำงานล่าช้า', en: 'System Lag' },
  device_compatibility: { th: 'ปัญหาบราวเซอร์/อุปกรณ์', en: 'Device Compatibility' },
  registration: { th: 'การสมัครสมาชิก', en: 'Registration' },
  feature_request: { th: 'ขอเพิ่มฟีเจอร์', en: 'Feature Request' },
  feedback_complaint: { th: 'ข้อเสนอแนะและร้องเรียน', en: 'Feedback & Complaint' },
  performance_issue: { th: 'ประสิทธิภาพระบบช้า', en: 'Performance Issue' },
  vip_privilege: { th: 'สิทธิประโยชน์ระดับ VIP', en: 'VIP Privileges' },
  other: { th: 'เรื่องอื่นๆ', en: 'Other Inquiries' },
  not_a_problem: { th: 'ไม่ใช่ปัญหา', en: 'Not an Issue' }
};

export function getBaseCatId(id: string | null | undefined): string {
  if (!id || typeof id !== 'string') return '';
  return id.includes(':') ? id.split(':').pop()! : id;
}

export function formatCategoryLabel(rawName: string | null | undefined, lang: 'th' | 'en' = 'th'): string {
  if (!rawName || typeof rawName !== 'string') return '';
  const match = rawName.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (match) {
    const thaiPart = match[1].trim();
    const engPart = match[2].trim();
    if (lang === 'en') return engPart;
    if (lang === 'th') return thaiPart;
    return `${thaiPart} (${engPart})`;
  }
  const baseKey = getBaseCatId(rawName);
  if (KNOWN_CATEGORY_NAMES[baseKey]) {
    return KNOWN_CATEGORY_NAMES[baseKey][lang] || KNOWN_CATEGORY_NAMES[baseKey].th;
  }
  return rawName;
}

export function getCategoryLabel(cat: any, lang: 'th' | 'en' = 'th'): string {
  if (!cat) return lang === 'en' ? 'Other Inquiries' : 'เรื่องอื่นๆ';

  if (typeof cat === 'string') {
    const baseKey = getBaseCatId(cat);
    if (KNOWN_CATEGORY_NAMES[baseKey]) {
      return KNOWN_CATEGORY_NAMES[baseKey][lang] || KNOWN_CATEGORY_NAMES[baseKey].th;
    }
    const match = cat.match(/^(.+?)\s*\(([^)]+)\)$/);
    if (match) {
      return lang === 'en' ? match[2].trim() : match[1].trim();
    }
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(baseKey)) {
      return lang === 'en' ? 'Other Inquiries' : 'เรื่องอื่นๆ';
    }
    return cat;
  }

  // cat is an object
  const baseKey = getBaseCatId(cat.id || '');
  if (lang === 'en') {
    if (cat.name_en && typeof cat.name_en === 'string' && cat.name_en.trim()) {
      return cat.name_en.trim();
    }
    if (KNOWN_CATEGORY_NAMES[baseKey]?.en) {
      return KNOWN_CATEGORY_NAMES[baseKey].en;
    }
    if (cat.name) {
      const match = String(cat.name).match(/^(.+?)\s*\(([^)]+)\)$/);
      if (match) return match[2].trim();
    }
    return cat.name || cat.title || cat.id || 'Other Inquiries';
  } else {
    if (cat.name_th && typeof cat.name_th === 'string' && cat.name_th.trim()) {
      return cat.name_th.trim();
    }
    if (cat.name) {
      const match = String(cat.name).match(/^(.+?)\s*\(([^)]+)\)$/);
      if (match) return match[1].trim();
      return cat.name;
    }
    if (KNOWN_CATEGORY_NAMES[baseKey]?.th) {
      return KNOWN_CATEGORY_NAMES[baseKey].th;
    }
    return cat.title || cat.id || 'เรื่องอื่นๆ';
  }
}

export function formatCategoryOptions(categories: any[], lang: 'th' | 'en' = 'th') {
  return (categories || []).map(cat => ({
    value: cat.id,
    baseValue: getBaseCatId(cat.id),
    label: lang === 'en' 
      ? (cat.name_en || getCategoryLabel(cat, 'en')) 
      : (cat.name_th || cat.name || getCategoryLabel(cat, 'th'))
  }));
}
