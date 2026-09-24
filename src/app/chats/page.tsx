'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import Link from 'next/link';
import { 
  Search, Filter, Clock, AlertTriangle, MessageSquare, 
  User, Mail, Phone, Calendar, RefreshCw, ChevronRight,
  CheckCircle, ArrowLeft, Download, Copy, Sparkles, BookOpen, Check, X, Minus,
  FileSpreadsheet, RotateCcw
} from 'lucide-react';
import LanguageToggle from '@/components/LanguageToggle';
import SoundSettingsModal from '@/components/SoundSettingsModal';
import { playAlertTone, isSoundEnabled } from '@/lib/audio';
import { supabase } from '@/lib/supabase';

// Custom regex-based parser for AI Recommendation Markdown structure (Multi-Issue Breakdown)
function parseAIRecommendation(markdown: string) {
  if (!markdown) return null;

  // Split by the key indicator "📌" or "Multi-Issue Breakdown"
  const parts = markdown.split(/📌.*:/);
  
  const generalRecommendation = parts[0]?.trim() || "";
  const issuesText = parts[1]?.trim() || markdown; // Fallback to entire text if no emoji found
  
  const issues: any[] = [];
  
  if (issuesText) {
    // Split by "- เรื่องที่"
    const issueBlocks = issuesText.split(/(?=-\s*เรื่องที่\s*\d+)/);
    
    issueBlocks.forEach(block => {
      if (!block.trim()) return;
      if (!block.includes('เรื่องที่')) return;
      
      // 1. Extract issue title
      // Format A: "- เรื่องที่ 1: [title]" or "- เรื่องที่ 1 ([title])"
      let title = "";
      const titleMatchA = block.match(/-\s*เรื่องที่\s*\d+\s*:\s*([^\n\r\|-]+)/);
      const titleMatchB = block.match(/-\s*เรื่องที่\s*\d+\s*\(([^)]+)\)/);
      if (titleMatchB) {
        title = titleMatchB[1].trim();
      } else if (titleMatchA) {
        title = titleMatchA[1].trim();
      }
      
      // 2. Extract sub-category
      // Format A: "- หมวดหมู่: [cat]" or "จัดอยู่ในหมวดหมู่ [cat]"
      let category = "";
      const catMatchA = block.match(/(?:หมวดหมู่|จัดอยู่ในหมวดหมู่)\s*:\s*([^\n\r\|-]+)/);
      const catMatchB = block.match(/(?:หมวดหมู่|จัดอยู่ในหมวดหมู่)\s+([^\n\r\|-]+)/);
      if (catMatchA) {
        category = catMatchA[1].trim();
      } else if (catMatchB) {
        category = catMatchB[1].trim();
      }
      
      // 3. Extract department and priority
      let department = "";
      let priority = "low";
      const deptMatch = block.match(/แผนก\s*:\s*([^\(\n\r\|-]+)(?:\(ความเร่งด่วน\s*:\s*([^\)\n\r\|]+)\))?/);
      if (deptMatch) {
        department = deptMatch[1].trim();
        if (deptMatch[2]) {
          priority = deptMatch[2].trim();
        }
      }
      
      // 4. Extract recommended reply
      let reply = "";
      const replyMatch = block.match(/(?:แนะนำบทสนทนาตอบลูกค้า|คำตอบตอบลูกค้า|คำตอบแนะนำ|แนะนำบทสนทนาตอบกลับ)\s*:\s*["'«“]([^"'»”]+)["'»”]/);
      const replyMatchFallback = block.match(/(?:แนะนำบทสนทนาตอบลูกค้า|คำตอบตอบลูกค้า|คำตอบแนะนำ|แนะนำบทสนทนาตอบกลับ)\s*:\s*([^\n\r]+)/);
      if (replyMatch) {
        reply = replyMatch[1].trim();
      } else if (replyMatchFallback) {
        reply = replyMatchFallback[1].trim().replace(/^["'«“]|["'»”]$/g, "");
      }
      
      if (title) {
        issues.push({
          title,
          category,
          department,
          priority,
          reply
        });
      }
    });
  }
  
  return {
    generalRecommendation: generalRecommendation === markdown ? "" : generalRecommendation,
    issues
  };
}

// Normalizes category ID by stripping multi-tenant prefix (e.g. 2e65829a...:deposit_withdrawal -> deposit_withdrawal)
function getBaseCatId(id: string) {
  if (!id || typeof id !== 'string') return '';
  return id.includes(':') ? id.split(':')[1] : id;
}

// Formats category name cleanly according to active language (e.g. Thai only in 'th', English only in 'en')
function formatCategoryLabel(rawName: string, lang: 'th' | 'en' = 'th'): string {
  if (!rawName || typeof rawName !== 'string') return '';
  const match = rawName.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (match) {
    const thaiPart = match[1].trim();
    const engPart = match[2].trim();
    if (lang === 'en') return engPart;
    if (lang === 'th') return thaiPart;
    return `${thaiPart} (${engPart})`;
  }
  return rawName;
}

function inferPriorityFromText(text: string, defaultPri?: string) {
  const raw = (text || '').toLowerCase();
  
  if (raw.includes('ข้ามวัน') || raw.includes('แจ้งความ') || raw.includes('แฮก') || raw.includes('502') || raw.includes('เงินหาย') || raw.includes('ขู่')) {
    return 'urgent';
  }
  if (raw.includes('ฝาก') || raw.includes('ถอน') || raw.includes('สลิป') || raw.includes('โอน') || raw.includes('ยอดไม่เข้า') || raw.includes('ล็อกอิน') || raw.includes('รหัสผ่าน')) {
    return 'high';
  }
  if (raw.includes('ค้าง') || raw.includes('หมุน') || raw.includes('ช้า') || raw.includes('โหลด')) {
    return 'medium';
  }
  if (raw.includes('โปร') || raw.includes('โบนัส') || raw.includes('แนะนำเพื่อน') || raw.includes('ขอบคุณ') || raw.includes('สวัสดี')) {
    return 'low';
  }
  
  return defaultPri?.toLowerCase() || 'medium';
}

function inferCategoryFromText(text: string, defaultCat?: string, categories: any[] = []) {
  if (defaultCat && defaultCat !== 'other' && defaultCat !== 'not_a_problem') {
    const cleanDefault = getBaseCatId(defaultCat);
    if (cleanDefault === 'ui_rendering_issue') return 'page_load_freeze';
    if (cleanDefault) return cleanDefault;
  }

  const raw = (text || '').toLowerCase();
  
  if (raw.includes('ฝาก') || raw.includes('ถอน') || raw.includes('สลิป') || raw.includes('โอนเงิน') || raw.includes('โอน') || raw.includes('เลขบัญชี') || raw.includes('ยอดไม่เข้า') || raw.includes('เช็คยอด') || raw.includes('ข้ามวัน') || (raw.includes('เงิน') && raw.includes('เข้า'))) {
    return 'deposit_withdrawal';
  }
  if (raw.includes('ค้าง') || raw.includes('หน้าหมุน') || raw.includes('โหลดช้า') || raw.includes('โหลดนาน') || raw.includes('โหลด') || raw.includes('ช้า') || raw.includes('หมุน')) {
    return 'page_load_freeze';
  }
  if (raw.includes('ล็อกอิน') || raw.includes('login') || raw.includes('เข้าไม่ได้') || raw.includes('รหัสผ่าน') || raw.includes('เข้าสู่ระบบ')) {
    return 'login_issue';
  }
  if (raw.includes('โบนัส') || raw.includes('โปร') || raw.includes('เครดิตฟรี') || raw.includes('bonus') || raw.includes('วันเกิด') || raw.includes('กิจกรรม')) {
    return 'promo_bonus';
  }
  if (raw.includes('ความปลอดภัย') || raw.includes('security') || raw.includes('otp')) {
    return 'account_security';
  }
  if (raw.includes('502') || raw.includes('blocked') || raw.includes('ลิงก์') || raw.includes('ทางเข้า')) {
    return 'access_blocked';
  }
  if (raw.includes('เกม') || raw.includes('game') || raw.includes('เดิมพัน') || raw.includes('เว็บบอร์ด') || raw.includes('แตก')) {
    return 'game_issue';
  }

  return getBaseCatId(defaultCat || '') || (categories[0] ? getBaseCatId(categories[0].id) : 'other');
}

function inferCategoryFromTextLine(text: string, defaultCat?: string, categories: any[] = []) {
  const raw = (text || '').toLowerCase();
  
  if (raw.includes('ฝาก') || raw.includes('ถอน') || raw.includes('สลิป') || raw.includes('โอนเงิน') || raw.includes('โอน') || raw.includes('เลขบัญชี') || raw.includes('ยอดไม่เข้า') || raw.includes('เช็คยอด') || raw.includes('ข้ามวัน') || raw.includes('โกง') || raw.includes('รอนาน') || (raw.includes('เงิน') && raw.includes('เข้า'))) {
    return 'deposit_withdrawal';
  }
  if (raw.includes('ค้าง') || raw.includes('หน้าหมุน') || raw.includes('โหลดช้า') || raw.includes('โหลดนาน') || raw.includes('โหลด') || raw.includes('ช้า') || raw.includes('หมุน')) {
    return 'page_load_freeze';
  }
  if (raw.includes('ล็อกอิน') || raw.includes('login') || raw.includes('เข้าไม่ได้') || raw.includes('รหัสผ่าน') || raw.includes('เข้าสู่ระบบ')) {
    return 'login_issue';
  }
  if (raw.includes('โบนัส') || raw.includes('โปร') || raw.includes('เครดิตฟรี') || raw.includes('bonus') || raw.includes('วันเกิด') || raw.includes('กิจกรรม')) {
    return 'promo_bonus';
  }
  if (raw.includes('ความปลอดภัย') || raw.includes('security') || raw.includes('otp')) {
    return 'account_security';
  }
  if (raw.includes('502') || raw.includes('blocked') || raw.includes('ลิงก์') || raw.includes('ทางเข้า')) {
    return 'access_blocked';
  }
  if (raw.includes('เกม') || raw.includes('game') || raw.includes('เดิมพัน') || raw.includes('เว็บบอร์ด') || raw.includes('แตก')) {
    return 'game_issue';
  }
  if (raw.includes('แอดมิน') || raw.includes('แอด') || raw.includes('ไม่ตอบ') || raw.includes('ตอบหน่อย') || raw.includes('ตอบแชท') || raw.includes('ตอบด้วย') || raw.includes('ตอแหล') || raw.includes('ด่า')) {
    return 'other';
  }

  // Fallback to cleaner default or 'other'
  const cleanDefault = getBaseCatId(defaultCat || '');
  if (cleanDefault && cleanDefault !== 'deposit_withdrawal' && cleanDefault !== 'other' && cleanDefault !== 'not_a_problem') {
    return cleanDefault;
  }

  return 'other';
}

function getTriageDuration(id: string): string {
  if (!id) return '0.5';
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const val = 0.4 + (Math.abs(hash) % 8) / 10;
  return val.toFixed(1);
}

function buildInitialIssues(targetChat: any, categories: any[] = []) {
  if (!targetChat) return [];
  if (targetChat.chat_issues && Array.isArray(targetChat.chat_issues) && targetChat.chat_issues.length > 0) {
    return targetChat.chat_issues;
  }

  const rawConv = targetChat.conversation || (targetChat.rawMessages ? targetChat.rawMessages.join('\n') : targetChat.summary || '');
  const convLines = (rawConv || '')
    .split('\n')
    .map((l: string) => l.trim().replace(/^ลูกค้า:\s*/, ''))
    .filter((l: string) => l.length > 0);

  if (convLines.length === 0) {
    return [{
      id: `${targetChat.id || 'chat'}-issue-0`,
      summary: targetChat.summary || 'ไม่มีข้อมูลสรุป',
      category_id: inferCategoryFromTextLine(targetChat.summary || '', targetChat.category_id, categories),
      priority: inferPriorityFromText(targetChat.summary || '', targetChat.priority)
    }];
  }

  // Map 1-to-1 for EVERY conversation line so every message line in the chat box gets its own Category & Priority control!
  return convLines.map((line: string, i: number) => ({
    id: `${targetChat.id || 'chat'}-issue-${i}`,
    summary: line,
    category_id: inferCategoryFromTextLine(line, targetChat.category_id, categories),
    priority: inferPriorityFromText(line, targetChat.priority)
  }));
}

// Formats priority string to matching mockup text (Thai + English parenthetical)
function formatPriorityLabel(priority: string) {
  const p = priority.trim().toLowerCase();
  if (p === 'urgent' || p === 'ด่วนที่สุด' || p === 'เร่งด่วน') return 'เร่งด่วน (Urgent)';
  if (p === 'high' || p === 'ด่วนสูง' || p === 'สูง') return 'สูง (High)';
  if (p === 'medium' || p === 'ปานกลาง') return 'ปานกลาง (Medium)';
  if (p === 'low' || p === 'ด่วนน้อย' || p === 'ต่ำ') return 'ต่ำ (Low)';
  return priority;
}

// Renders left side bullet icons matching mockup
function getIssueIcon(department: string, category: string) {
  const dept = department.toLowerCase();
  const cat = category.toLowerCase();
  
  if (dept.includes('finance') || dept.includes('บัญชี') || dept.includes('เงิน') || cat.includes('deposit') || cat.includes('withdraw') || cat.includes('โอน')) {
    return (
      <div className="w-7 h-7 rounded-full bg-purple-50 dark:bg-purple-955/40 flex items-center justify-center text-purple-650 dark:text-purple-400 font-extrabold text-sm border border-purple-200/50 dark:border-purple-900/50 shrink-0 select-none">
        $
      </div>
    );
  }
  
  if (dept.includes('developer') || dept.includes('tech') || dept.includes('ระบบ') || cat.includes('freeze') || cat.includes('page') || cat.includes('button') || cat.includes('ค้าง')) {
    return (
      <div className="w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-955/40 flex items-center justify-center text-rose-600 dark:text-rose-455 font-extrabold text-sm border border-rose-200/50 dark:border-rose-900/30 shrink-0 select-none">
        ★
      </div>
    );
  }

  // Support / Generic
  return (
    <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-955/40 flex items-center justify-center text-blue-600 dark:text-blue-455 font-extrabold text-sm border border-blue-200/50 dark:border-blue-900/30 shrink-0 select-none">
      ⓘ
    </div>
  );
}

// ================= FLOATING CHAT WINDOW COMPONENT =================
// ================= FLOATING CHAT WINDOW COMPONENT (UNIFIED VIEW - NO TABS) =================
function FloatingChatWindow({ 
  chat, 
  initialX, 
  initialY, 
  initialZIndex, 
  categories, 
  userProfile, 
  allChats,
  onClose, 
  onFocus, 
  onSaved,
  onPositionChange,
  onUpdateTags,
  onOpenChat
}: any) {
  const [x, setX] = useState(initialX);
  const [y, setY] = useState(initialY);
  const [width, setWidth] = useState(760);
  const [height, setHeight] = useState(620);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  


  if (!chat) return null;

  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [selectedChatIssues, setSelectedChatIssues] = useState<any[]>(() => buildInitialIssues(chat, categories));
  const [editIssues, setEditIssues] = useState<Record<string, any>>(() => {
    const initialMap: Record<string, any> = {};
    try {
      const initList = buildInitialIssues(chat, categories);
      if (Array.isArray(initList)) {
        initList.forEach((issue: any) => {
          if (issue) {
            const issueKey = issue.id || 'issue-0';
            initialMap[issueKey] = {
              category_id: getBaseCatId(issue.category_id || chat?.category_id || ''),
              priority: (issue.priority || inferPriorityFromText(issue.summary || '', 'medium')).toLowerCase()
            };
          }
        });
      }
    } catch (e) {}
    return initialMap;
  });
  
  const [editCategory, setEditCategory] = useState(chat?.category_id || '');
  const [editPriority, setEditPriority] = useState(chat?.priority || 'low');
  
  // Custom Tags State
  const [tags, setTags] = useState<string[]>(chat?.tags || []);
  const [customTagInput, setCustomTagInput] = useState('');
  
  const [updating, setUpdating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Inline tag editing state
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [editingTagValue, setEditingTagValue] = useState('');

  const handleStartEditTag = (index: number, currentVal: string) => {
    setEditingTagIndex(index);
    setEditingTagValue(currentVal);
  };

  const handleSaveEditTag = (index: number) => {
    if (!editingTagValue.trim()) return;
    let formatted = editingTagValue.trim();
    if (!formatted.startsWith('#')) formatted = '#' + formatted;
    
    const nextTags = [...tags];
    nextTags[index] = formatted;
    setTags(nextTags);
    if (onUpdateTags) onUpdateTags(chat.id, nextTags);
    setEditingTagIndex(null);
  };

  const handleTogglePresetTag = (tagName: string) => {
    let nextTags: string[];
    if (tags.includes(tagName)) {
      nextTags = tags.filter(t => t !== tagName);
    } else {
      nextTags = [...tags, tagName];
    }
    setTags(nextTags);
    if (onUpdateTags) onUpdateTags(chat.id, nextTags);
  };

  const handleRemoveTag = (tagName: string) => {
    const nextTags = tags.filter(t => t !== tagName);
    setTags(nextTags);
    if (onUpdateTags) onUpdateTags(chat.id, nextTags);
  };

  const handleAddCustomTag = () => {
    if (!customTagInput.trim()) return;
    let formatted = customTagInput.trim();
    if (!formatted.startsWith('#')) formatted = '#' + formatted;
    if (!tags.includes(formatted)) {
      const nextTags = [...tags, formatted];
      setTags(nextTags);
      if (onUpdateTags) onUpdateTags(chat.id, nextTags);
    }
    setCustomTagInput('');
  };

  const getBaseCatId = (id: string) => (id && typeof id === 'string' && id.includes(':')) ? id.split(':')[1] : (id || '');



  // Fetch issues & customer info in background without blocking UI render
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [issuesRes, custRes] = await Promise.all([
          fetch('/api/chats/issues?chat_id=' + chat.id).catch(() => null),
          chat.customer_id ? fetch('/api/customers?customer_id=' + chat.customer_id).catch(() => null) : Promise.resolve(null)
        ]);

        if (issuesRes && issuesRes.ok) {
          const issuesData = await issuesRes.json();
          if (isMounted && issuesData && Array.isArray(issuesData) && issuesData.length > 0) {
            setSelectedChatIssues(issuesData);
            setEditIssues(prev => {
              const updatedEditState: Record<string, any> = { ...prev };
              issuesData.forEach((issue: any) => {
                const issueKey = issue.id || 'issue-0';
                const directCat = getBaseCatId(issue.category_id || '');
                const directPri = (issue.priority || 'medium').toLowerCase();
                updatedEditState[issueKey] = {
                  category_id: directCat,
                  priority: directPri
                };
              });
              return updatedEditState;
            });
          }
        }

        if (custRes && custRes.ok) {
          const cust = await custRes.json();
          if (isMounted && cust) {
            setCustomerInfo(cust);
          }
        }
      } catch (err) {
        console.error('Error fetching modal background data:', err);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [chat.id]);

  const handleMouseDown = (e: any) => {
    onFocus();
    
    // Don't drag if maximized or clicking buttons, select, or inputs
    const target = e.target as HTMLElement;
    if (isMaximized || target.closest('button') || target.closest('select') || target.closest('input')) {
      return;
    }

    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const currentX = x;
    const currentY = y;

    const handleMouseMove = (moveEvent: any) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const newX = Math.max(10, currentX + dx);
      const newY = Math.max(10, currentY + dy);
      setX(newX);
      setY(newY);
      onPositionChange(newX, newY);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleCopyText = (text: any, id: any) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveChanges = async () => {
    setUpdating(true);
    try {
      let history: any[] = [];
      try {
        if (chat.resolution && chat.resolution !== 'Pending' && chat.resolution !== 'Solved') {
          const parsed = JSON.parse(chat.resolution);
          if (Array.isArray(parsed)) {
            history = parsed;
          }
        }
      } catch (e) {}

      const hasDbIssues = selectedChatIssues && selectedChatIssues.length > 0;
      let isCorrect = true;
      if (hasDbIssues) {
        selectedChatIssues.forEach((issue) => {
          const currentEdit = editIssues[issue.id];
          if (currentEdit) {
            if (currentEdit.category_id !== (issue.category_id || '') || currentEdit.priority !== (issue.priority || 'low')) {
              isCorrect = false;
            }
          }
        });
      } else {
        if (editCategory !== (chat.category_id || '') || editPriority !== (chat.priority || 'low')) {
          isCorrect = false;
        }
      }

      const issuesToSubmit = hasDbIssues
        ? selectedChatIssues.map((issue) => ({
            id: issue.id,
            category_id: editIssues[issue.id]?.category_id || null,
            priority: editIssues[issue.id]?.priority || 'low'
          }))
        : [];

      let finalCategoryId = editCategory;
      let finalPriority = editPriority;
      if (hasDbIssues && issuesToSubmit.length > 0) {
        finalCategoryId = issuesToSubmit[0].category_id || '';
        
        const prioOrder: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
        let maxVal = 1;
        let maxPrio = 'low';
        issuesToSubmit.forEach((issue) => {
          const p = (issue.priority || 'low').toLowerCase();
          if (prioOrder[p] && prioOrder[p] > maxVal) {
            maxVal = prioOrder[p];
            maxPrio = p;
          }
        });
        finalPriority = maxPrio;
      }

      const newLog = {
        timestamp: new Date().toISOString(),
        actor: 'คุณอ้อ (Admin)',
        old_category: chat.category_id || '',
        new_category: finalCategoryId || '',
        old_priority: chat.priority || 'low',
        new_priority: finalPriority || 'low'
      };
      
      const updatedHistory = [newLog, ...history];

      const res = await fetch('/api/chats/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chat.id,
          is_correct: isCorrect,
          liked_by: customerInfo?.name || chat.customer_id || 'admin',
          issues: issuesToSubmit,
          category_id: finalCategoryId || null,
          priority: finalPriority || null,
          resolution: JSON.stringify(updatedHistory)
        })
      });

      if (res.ok) {
        // Log to activity_logs table
        try {
          await supabase.from('activity_logs').insert([{
            company_id: userProfile?.company_id || '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2',
            user_id: userProfile?.id || 'admin-01',
            user_name: userProfile?.name || 'Admin',
            action_type: 'UPDATE_CATEGORY',
            details: { chat_id: chat.id, old_category: chat.category_id, new_category: finalCategoryId, old_priority: chat.priority, new_priority: finalPriority }
          }]);
        } catch (e) {
          console.warn('activity_logs insert:', e);
        }

        onSaved();
      }
    } catch (err) {
      console.error('Error saving chat feedback:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleResizeMouseDown = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startWidth = width;
    const startHeight = height;
    const startX = e.clientX;
    const startY = e.clientY;

    const handleMouseMove = (moveEvent: any) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      const newWidth = Math.max(680, startWidth + dx);
      const newHeight = Math.max(350, startHeight + dy);
      
      setWidth(newWidth);
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const renderConversation = () => {
    let rawText = chat.conversation;
    
    if (!rawText && selectedChatIssues && selectedChatIssues.length > 0) {
      rawText = selectedChatIssues.map((i: any) => `ลูกค้า: ${i.summary}`).join('\n');
    } else if (!rawText && chat.chat_issues && chat.chat_issues.length > 0) {
      rawText = chat.chat_issues.map((i: any) => `ลูกค้า: ${i.summary}`).join('\n');
    } else if (!rawText && chat.summary) {
      rawText = `ลูกค้า: ${chat.summary}`;
    }

    if (!rawText) {
      return (
        <div className="text-slate-400 dark:text-slate-500 italic text-xs p-4 text-center">
          ไม่มีประวัติบทสนทนา
        </div>
      );
    }

    // Robust Image URL Extraction (handles query params & all image types)
    const foundImages: string[] = [];
    if (chat.media_urls && Array.isArray(chat.media_urls)) {
      foundImages.push(...chat.media_urls);
    }

    const genericUrlRegex = /(https?:\/\/[^\s\n"']+)/gi;
    const urlMatches = rawText.match(genericUrlRegex) || [];
    urlMatches.forEach((url: string) => {
      const cleanUrl = url.trim().replace(/[,\.\)]$/, '');
      const isImg = /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(cleanUrl) ||
                    /photo-/i.test(cleanUrl) ||
                    /images/i.test(cleanUrl) ||
                    /slip/i.test(cleanUrl) ||
                    /storage/i.test(cleanUrl);
      if (isImg && !foundImages.includes(cleanUrl)) {
        foundImages.push(cleanUrl);
      }
    });

    // Clean text display: strip raw image URLs so message text is clean
    let cleanedText = rawText;
    foundImages.forEach(imgUrl => {
      cleanedText = cleanedText.replace(imgUrl, '').trim();
    });

    return (
      <div className="space-y-3">
        {/* Chat Text Bubble */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-750 text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line select-text min-h-[100px] max-h-[300px] overflow-y-auto">
          {cleanedText || <span className="text-slate-400 dark:text-slate-555 italic">ลูกค้าส่งรูปภาพแนบมาในบทสนทนา</span>}
        </div>

        {/* 🖼️ Embedded Real Image Preview Cards */}
        {foundImages.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-950/40 dark:to-purple-950/40 p-3.5 rounded-2xl border border-indigo-150 dark:border-indigo-900/50 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-indigo-800 dark:text-indigo-300 uppercase tracking-wide flex items-center gap-1.5">
                <span>🖼️</span>
                <span>รูปภาพแนบจากลูกค้า / สภาพหน้าจอขัดข้อง ({foundImages.length} รูป)</span>
              </span>
              <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400">คลิกเพื่อดูรูปใหญ่</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {foundImages.map((imgUrl, iidx) => (
                <a
                  key={iidx}
                  href={imgUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block rounded-xl overflow-hidden border border-indigo-200/80 dark:border-indigo-800/60 bg-black/10 hover:shadow-md transition duration-200 aspect-video"
                  title="คลิกเพื่อเปิดรูปภาพขนาดใหญ่ความละเอียดสูง"
                >
                  <img 
                    src={imgUrl} 
                    alt={`Customer Upload ${iidx + 1}`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={(e: any) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-between p-2 text-white">
                    <span className="text-[10px] font-bold">🔍 ดูรูปภาพขนาดเต็ม</span>
                    <span className="text-[9px] bg-white/30 backdrop-blur-xs px-1.5 py-0.5 rounded font-mono">#รูปภาพ-{iidx + 1}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      style={isMaximized ? {
        left: '2.5%',
        top: '7.5%',
        width: '95%',
        height: '85%',
        zIndex: 1000,
        transform: 'none'
      } : {
        left: x + 'px',
        top: y + 'px',
        zIndex: initialZIndex,
        width: width + 'px',
        height: isMinimized ? '48px' : height + 'px',
      }}
      className="fixed bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-shadow duration-200 focus-within:ring-2 focus-within:ring-indigo-500/20"
      onClick={onFocus}
    >
      {/* Header bar (Draggable) */}
      <div 
        onMouseDown={handleMouseDown}
        className="p-3 bg-slate-50 dark:bg-slate-855 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-move select-none shrink-0"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
          <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs truncate">
            {customerInfo?.name || chat.customer_name || (
              chat.customer_id === 'cust-003' ? 'Anan (อนันต์)' :
              chat.customer_id === 'cust-001' ? 'Somchai (สมชาย)' :
              chat.customer_id === 'cust-002' ? 'Somsri (สมศรี)' :
              'ลูกค้า #' + (chat.customer_id || chat.id?.substring(0, 8))
            )}
          </h3>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Minimize button */}
          <button 
            type="button"
            onClick={() => {
              setIsMinimized(!isMinimized);
              if (isMaximized) setIsMaximized(false); // Restore if minimized
            }}
            className="w-6 h-6 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center transition cursor-pointer"
            title={isMinimized ? 'ย่อหน้าต่าง' : 'พับหน้าต่าง'}
          >
            <Minus size={12} />
          </button>

          {/* Maximize button */}
          <button 
            type="button"
            onClick={() => {
              setIsMaximized(!isMaximized);
              setIsMinimized(false); // Expand height if maximized
            }}
            className="w-6 h-6 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center transition cursor-pointer"
            title={isMaximized ? 'ย่อกลับขนาดปกติ' : 'ขยายเต็มหน้าจอ'}
          >
            {isMaximized ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <rect x="3" y="1" width="6" height="6" rx="0.5" />
                <rect x="1" y="3" width="6" height="6" rx="0.5" fill="white" className="dark:fill-slate-900" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <rect x="1.5" y="1.5" width="7" height="7" rx="0.5" />
              </svg>
            )}
          </button>
          
          {/* Close button */}
          <button 
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-md hover:bg-rose-50 dark:hover:bg-rose-955/20 text-slate-500 hover:text-rose-600 dark:text-slate-400 flex items-center justify-center transition cursor-pointer"
            title="ปิด"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Body scroll section (Unified sequentially - Instant 0ms Render!) */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/20 dark:bg-slate-900/10">
          <div className="space-y-6">
              
              {/* SECTION 1: Conversation History & Side-by-Side Category/Priority Controls */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-850 dark:text-slate-200 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                    💬 ประวัติการคุย (CONVERSATION HISTORY)
                  </h4>
                  <span className="text-[9px] text-slate-400 font-mono font-bold select-none">แชตไอดี: {chat.id}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  {/* Left Column (Span 6): Single raw conversation history text box from Supabase */}
                  <div className="lg:col-span-6">
                    {renderConversation()}
                  </div>

                  {/* Right Column (Span 6): Triage Category & Priority controls per child chat_issue */}
                  <div className="lg:col-span-6 space-y-3 pt-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        ประเด็นย่อยในตาราง chat_issues ({((selectedChatIssues && selectedChatIssues.length > 0) ? selectedChatIssues : buildInitialIssues(chat)).length} เรื่อง)
                      </span>
                    </div>

                    {(() => {
                      let activeIssuesList = (selectedChatIssues && selectedChatIssues.length > 0)
                        ? selectedChatIssues
                        : buildInitialIssues(chat);

                      return activeIssuesList.map((issueItem: any, idx: number) => {
                        const issueKey = issueItem.id || 'issue-' + idx;
                        const issueTitle = issueItem.summary || issueItem.issue_summary || `ประเด็นย่อยที่ ${idx + 1}`;
                        const currentVal = editIssues[issueKey] || { 
                          category_id: issueItem.category_id || '', 
                          priority: issueItem.priority || 'medium' 
                        };
                        const selectedCategoryVal = getBaseCatId(currentVal.category_id || issueItem.category_id || '');
                        const currentPri = (currentVal.priority || issueItem.priority || 'medium').toLowerCase();

                        return (
                          <div key={idx} className="p-3 bg-slate-50/90 dark:bg-slate-855 rounded-xl border border-slate-200/80 dark:border-slate-750 shadow-xs space-y-2">
                            {/* Card Title (chat_issues.summary) */}
                            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                              <span className="flex items-center gap-1.5 min-w-0">
                                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold shrink-0">📌 #{idx + 1}</span>
                                <span className="truncate">{issueTitle}</span>
                              </span>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono shrink-0">ID: {issueKey.substring(0, 10)}</span>
                            </div>

                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-0.5">
                              {/* Category Dropdown (Bind to chat_issues.category_id) */}
                              <select
                                value={selectedCategoryVal}
                                onChange={(e) => {
                                  const newCat = e.target.value;
                                  setEditIssues(prev => ({
                                    ...prev,
                                    [issueKey]: { ...currentVal, category_id: newCat }
                                  }));
                                  if (idx === 0) setEditCategory(newCat);
                                }}
                                disabled={userProfile?.role === 'agent'}
                                className="flex-1 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-2.5 py-1.5 rounded-lg focus:border-indigo-600 focus:outline-none cursor-pointer shadow-xs min-w-[160px]"
                              >
                                <option value="">{language === 'th' ? '-- เลือกหมวดหมู่ --' : '-- Select Category --'}</option>
                                {categories.map((cat: any) => {
                                  const optionVal = getBaseCatId(cat.id);
                                  return (
                                    <option key={cat.id} value={optionVal}>{formatCategoryLabel(cat.name, language)}</option>
                                  );
                                })}
                              </select>

                              {/* Priority Buttons (Bind to chat_issues.priority) */}
                              <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-250 dark:border-slate-700 shadow-xs shrink-0">
                                {['low', 'medium', 'high', 'urgent'].map(p => {
                                  const isActive = currentPri === p;
                                  let activeStyle = '';
                                  if (p === 'urgent') activeStyle = 'bg-rose-500 text-white font-extrabold shadow-xs';
                                  else if (p === 'high') activeStyle = 'bg-orange-500 text-white font-extrabold shadow-xs';
                                  else if (p === 'medium') activeStyle = 'bg-amber-500 text-white font-extrabold shadow-xs';
                                  else if (p === 'low') activeStyle = 'bg-blue-500 text-white font-extrabold shadow-xs';

                                  return (
                                    <button
                                      key={p}
                                      type="button"
                                      onClick={() => {
                                        setEditIssues(prev => ({
                                          ...prev,
                                          [issueKey]: { ...currentVal, priority: p }
                                        }));
                                        if (idx === 0) setEditPriority(p);
                                      }}
                                      disabled={userProfile?.role === 'agent'}
                                      className={'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition cursor-pointer ' + 
                                        (isActive ? activeStyle : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300')
                                      }
                                    >
                                      {p}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

                      {/* SECTION: Custom Tags Management */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <h5 className="font-extrabold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                            🏷️ แท็กป้ายกำกับเคส (Custom Tags)
                          </h5>
                          <span className="text-[10px] text-slate-400 font-bold">{(tags || []).length} แท็ก</span>
                        </div>

                        {/* Current Active Tags */}
                        <div className="flex flex-wrap items-center gap-1.5 min-h-[28px]">
                          {(tags || []).length > 0 ? (
                            tags.map((t: string, idx: number) => (
                              <span 
                                key={idx} 
                                className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-lg border bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-900/80 dark:text-indigo-100 dark:border-indigo-500 shadow-sm"
                              >
                                <span>{t}</span>
                                <button 
                                  type="button" 
                                  onClick={() => handleRemoveTag(t)} 
                                  className="hover:text-rose-400 text-indigo-400 dark:text-indigo-300 transition cursor-pointer font-black text-xs ml-0.5"
                                  title="ถอดแท็กนี้ออกจากแชตนี้"
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 dark:text-slate-400 font-medium italic text-xs">ยังไม่ได้ติดแท็ก (คลิกป้ายสำเร็จรูปด้านล่างเพื่อติดแท็ก)</span>
                          )}
                        </div>

                        {/* Preset Quick Tags */}
                        <div className="space-y-2 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider">ป้ายแท็กสำเร็จรูป:</span>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { name: '#VIP', style: 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/70 dark:text-purple-200 dark:border-purple-700' },
                              { name: '#ติดตามผล', style: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-700' },
                              { name: '#รอสลิป', style: 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/70 dark:text-sky-200 dark:border-sky-700' },
                              { name: '#ส่งเรื่องทีมเทคนิค', style: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-700' },
                              { name: '#รอธนาคารแก้ไข', style: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-700' },
                              { name: '#เคสพิเศษ', style: 'bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-950/70 dark:text-indigo-200 dark:border-indigo-700' }
                            ].map((ptag) => {
                              const isSelected = (tags || []).includes(ptag.name);
                              return (
                                <button
                                  key={ptag.name}
                                  type="button"
                                  onClick={() => handleTogglePresetTag(ptag.name)}
                                  className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 shadow-sm ${
                                    isSelected 
                                      ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 scale-105 shadow-md font-black border-indigo-500' 
                                      : 'hover:scale-[1.03]'
                                  } ${ptag.style}`}
                                >
                                  {isSelected ? '✓ ' : '+ '}{ptag.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* SECTION 3: Triage History Timeline */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
                        <h4 className="font-bold text-slate-850 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          📜 ประวัติการแก้ไข (Triage History Timeline)
                        </h4>
                        {(() => {
                          let history: any[] = [];
                          try {
                            if (chat.resolution && chat.resolution !== 'Pending' && chat.resolution !== 'Solved') {
                              const parsed = JSON.parse(chat.resolution);
                              if (Array.isArray(parsed)) {
                                history = parsed;
                              }
                            }
                          } catch (e) {}

                          return (
                            <div className="relative border-l border-slate-200 dark:border-slate-800 pl-4 ml-1.5 space-y-4">
                              {history.map((log: any, idx: number) => {
                                const oldCatName = categories.find((c: any) => c.id === log.old_category)?.name || log.old_category || 'อื่นๆ';
                                const newCatName = categories.find((c: any) => c.id === log.new_category)?.name || log.new_category || 'อื่นๆ';
                                return (
                                  <div key={idx} className="relative text-xs">
                                    <div className="absolute -left-[20.5px] top-1 w-1.5 h-1.5 rounded-full bg-indigo-600 ring-2 ring-indigo-50 dark:ring-indigo-955" />
                                    <div className="text-[9px] text-slate-400 font-bold">{new Date(log.timestamp).toLocaleString('th-TH')}</div>
                                    <div className="text-slate-700 dark:text-slate-355 font-bold mt-0.5">โดย: {log.actor}</div>
                                    <div className="text-[10px] text-slate-550 dark:text-slate-405 mt-0.5 leading-relaxed">
                                      หมวดหมู่: <span className="line-through">{formatCategoryLabel(oldCatName, language)}</span> ➔ <span className="font-bold text-indigo-600">{formatCategoryLabel(newCatName, language)}</span>
                                    </div>
                                  </div>
                                );
                              })}
                              
                              <div className="relative text-xs">
                                <div className="absolute -left-[20.5px] top-1 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 ring-2 ring-slate-100" />
                                <div className="text-[9px] text-slate-400 font-bold">{chat.created_at ? new Date(chat.created_at).toLocaleString('th-TH') : '-'}</div>
                                <div className="text-slate-500 font-bold mt-0.5">โดย: ระบบ AI (Gemini Triage)</div>
                                <div className="text-[10px] text-slate-550 mt-0.5">หมวดหมู่เริ่มต้น: {formatCategoryLabel(categories.find((c: any) => c.id === chat.category_id)?.name || (language === 'th' ? 'อื่นๆ' : 'Other'), language)}</div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
              </div>
        </div>
      )}
      
      {/* Resize Handle at the bottom right corner (Drag to Resize) */}
      {!isMinimized && !isMaximized && (
        <div 
          onMouseDown={handleResizeMouseDown}
          className="absolute bottom-1 right-1 w-5 h-5 cursor-se-resize flex items-end justify-end p-0.5 select-none z-50 group"
          title="ลากเพื่อปรับขนาดหน้าต่าง"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" className="text-slate-350 dark:text-slate-600 group-hover:text-indigo-550 transition-colors">
            <path d="M8 0 L0 8 M8 3 L3 8 M8 6 L6 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  );
}

export default function ChatsPage() {
  const { t, language } = useLanguage();
  const [chats, setChats] = useState<any[]>([]);
  const [filteredChats, setFilteredChats] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string>('2c3f46cc-fae8-4ef8-99e1-874dec8b2af2');
  
  // Floating Windows state
  const [activeWindows, setActiveWindows] = useState<any[]>([]);
  const [maxZIndex, setMaxZIndex] = useState(50);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Sound alarm state
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showSoundModal, setShowSoundModal] = useState(false);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [auditFilter, setAuditFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // System Tags & Tag Manager State
  const [allAvailableTags, setAllAvailableTags] = useState([
    { name: '#VIP', desc: 'ป้ายสีม่วง', style: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-955/30 dark:text-purple-300 dark:border-purple-900/50' },
    { name: '#ติดตามผล', desc: 'ป้ายสีส้ม', style: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-955/30 dark:text-amber-300 dark:border-amber-900/50' },
    { name: '#รอสลิป', desc: 'ป้ายสีฟ้า', style: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-955/30 dark:text-sky-300 dark:border-sky-900/50' },
    { name: '#ส่งเรื่องทีมเทคนิค', desc: 'ป้ายสีแดง', style: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-955/30 dark:text-rose-300 dark:border-rose-900/50' },
    { name: '#รอธนาคารแก้ไข', desc: 'ป้ายสีเขียว', style: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-955/30 dark:text-emerald-300 dark:border-emerald-900/50' },
    { name: '#เคสพิเศษ', desc: 'ป้ายสีอินดิโก้', style: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-955/30 dark:text-indigo-300 dark:border-indigo-900/50' }
  ]);

  const [showTagManagerModal, setShowTagManagerModal] = useState(false);
  const [editingSystemTagIndex, setEditingSystemTagIndex] = useState<number | null>(null);
  const [editingSystemTagValue, setEditingSystemTagValue] = useState('');

  const handleOpenTagManagerModal = () => {
    setShowTagManagerModal(true);
    setEditingSystemTagIndex(null);
  };

  const handleSaveRenameSystemTag = (index: number) => {
    if (!editingSystemTagValue.trim()) return;
    let formattedNew = editingSystemTagValue.trim();
    if (!formattedNew.startsWith('#')) formattedNew = '#' + formattedNew;

    const oldTagObj = allAvailableTags[index];
    const oldTagName = oldTagObj.name;

    // 1. Update available tags array
    const updatedAvailable = [...allAvailableTags];
    updatedAvailable[index] = { ...oldTagObj, name: formattedNew };
    setAllAvailableTags(updatedAvailable);

    // 2. Update ALL customer chats carrying oldTagName
    setChats(prev => prev.map(chat => {
      if (!chat.tags || !chat.tags.includes(oldTagName)) return chat;
      const updated = chat.tags.map((t: string) => t === oldTagName ? formattedNew : t);
      return { ...chat, tags: updated };
    }));

    // 3. Update active windows
    setActiveWindows(prev => prev.map(win => {
      if (!win.chat?.tags || !win.chat.tags.includes(oldTagName)) return win;
      const updated = win.chat.tags.map((t: string) => t === oldTagName ? formattedNew : t);
      return { ...win, chat: { ...win.chat, tags: updated } };
    }));

    // 4. Update current filter if filtering by old tag
    if (tagFilter === oldTagName) {
      setTagFilter(formattedNew);
    }

    setEditingSystemTagIndex(null);
  };

  // Global Tag Rename State
  const [showTagRenameModal, setShowTagRenameModal] = useState(false);
  const [tagToRename, setTagToRename] = useState('');
  const [newGlobalTagName, setNewGlobalTagName] = useState('');

  const handleOpenGlobalRenameModal = (targetTag: string) => {
    setTagToRename(targetTag);
    setNewGlobalTagName(targetTag);
    setShowTagRenameModal(true);
  };

  const handleExecuteGlobalTagRename = () => {
    if (!newGlobalTagName.trim() || !tagToRename) return;
    let formattedNew = newGlobalTagName.trim();
    if (!formattedNew.startsWith('#')) formattedNew = '#' + formattedNew;

    // Update ALL customer chats in the system carrying this tag
    setChats(prev => prev.map(chat => {
      if (!chat.tags || !chat.tags.includes(tagToRename)) return chat;
      const updated = chat.tags.map((t: string) => t === tagToRename ? formattedNew : t);
      return { ...chat, tags: updated };
    }));

    // If active windows have this tag, update active windows as well!
    setActiveWindows(prev => prev.map(win => {
      if (!win.chat?.tags || !win.chat.tags.includes(tagToRename)) return win;
      const updated = win.chat.tags.map((t: string) => t === tagToRename ? formattedNew : t);
      return { ...win, chat: { ...win.chat, tags: updated } };
    }));

    // Update current active filter if filtering by old tag
    if (tagFilter === tagToRename) {
      setTagFilter(formattedNew);
    }

    setShowTagRenameModal(false);
  };

  const handleUpdateTags = async (chatId: string, newTags: string[]) => {
    // 1. Instant local UI update
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, tags: newTags } : c));
    setActiveWindows(prev => prev.map(w => w.chat?.id === chatId ? { ...w, chat: { ...w.chat, tags: newTags } } : w));

    // 2. Persist to Supabase DB
    try {
      await fetch('/api/chats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: chatId, tags: newTags })
      });
    } catch (e) {
      console.warn('Failed to update tags in DB:', e);
    }

    // 3. Log to activity_logs table for Audit Trail
    try {
      const tagString = newTags && newTags.length > 0 ? newTags.join(', ') : 'ไม่มีแท็ก';
      await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_name: userProfile?.name || 'คุณอ้อ (Admin)',
          admin_email: userProfile?.id || 'aor@system',
          action: 'ติดแท็กป้ายกำกับเคส',
          details: `อัปเดตแท็กป้ายกำกับสำหรับแชตไอดี ${chatId} เป็น: ${tagString}`
        })
      });
    } catch (e) {
      console.warn('Failed to log tag activity:', e);
    }
  };

  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Search input ref for keyboard shortcut focus
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Calculate Filter Badge Counts
  const companyFilteredChats = chats.filter(c => !activeCompanyId || activeCompanyId === 'all' || c.company_id === activeCompanyId);
  const pendingCount = companyFilteredChats.filter(c => (c.status || 'pending') === 'pending').length;
  const completedCount = companyFilteredChats.filter(c => c.status === 'completed').length;

  const urgentCount = companyFilteredChats.filter(c => (c.priority || '').toLowerCase() === 'urgent').length;
  const highCount = companyFilteredChats.filter(c => (c.priority || '').toLowerCase() === 'high').length;
  const mediumCount = companyFilteredChats.filter(c => (c.priority || '').toLowerCase() === 'medium').length;
  const lowCount = companyFilteredChats.filter(c => (c.priority || '').toLowerCase() === 'low').length;

  const isAnyFilterActive = searchQuery !== '' || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || tagFilter !== 'all' || dateFilter !== 'today' || auditFilter !== 'all';

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setTagFilter('all');
    setDateFilter('today');
    setAuditFilter('all');
    setStartDate('');
    setEndDate('');
  };

  // Keyboard Shortcuts: '/' to focus search input, 'Escape' to close top floating window
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;

      if (e.key === 'Escape') {
        if (activeWindows.length > 0) {
          e.preventDefault();
          const sortedWindows = [...activeWindows].sort((a, b) => b.zIndex - a.zIndex);
          const topWindow = sortedWindows[0];
          if (topWindow) {
            setActiveWindows(prev => prev.filter(w => w.id !== topWindow.id));
          }
        }
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeWindows]);

  // Desktop Notification State
  const [desktopNotifyEnabled, setDesktopNotifyEnabled] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setDesktopNotifyEnabled(Notification.permission === 'granted');
    }
  }, []);

  const handleToggleDesktopNotification = async () => {
    if (!('Notification' in window)) {
      alert(language === 'th' ? 'เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือนเดสก์ท็อป' : 'Desktop notification is not supported');
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification('🔔 AI Triage Manager', {
        body: 'การแจ้งเตือนป๊อปอัพหน้าจอเปิดใช้งานเรียบร้อยแล้ว!',
        icon: '/favicon.ico'
      });
      setDesktopNotifyEnabled(true);
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('🔔 AI Triage Manager', {
          body: 'การแจ้งเตือนป๊อปอัพหน้าจอเปิดใช้งานเรียบร้อยแล้ว!',
          icon: '/favicon.ico'
        });
        setDesktopNotifyEnabled(true);
      }
    } else {
      alert(language === 'th' ? 'กรุณาอนุญาตการแจ้งเตือน (Notifications) ในการตั้งค่าเบราว์เซอร์ของคุณ' : 'Please allow notifications in browser settings');
    }
  };

  // 1-Click Single Status Toggle Handler
  const handleToggleSingleStatus = async (chat: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = chat.status === 'completed' ? 'pending' : 'completed';

    // Optimistic UI update
    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, status: newStatus } : c));
    setFilteredChats(prev => prev.map(c => c.id === chat.id ? { ...c, status: newStatus } : c));

    // Persist to backend API
    try {
      await fetch('/api/chats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: [chat.id],
          status: newStatus
        })
      });

      // 📜 Record to Audit & Activity Logs
      const statusLabel = newStatus === 'completed' ? 'แยกแยะแล้ว' : 'รอดำเนินการ';
      const detailMsg = `อัปเดตสถานะแชต #${chat.id} เป็น [${statusLabel}] เรียบร้อยแล้ว`;
      await logActivityTrail('TRIAGE_UPDATE', chat.id, chat.status || 'pending', detailMsg);
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Export CSV Handler with complete fields and UTF-8 BOM
  const handleExportCSV = () => {
    if (filteredChats.length === 0) return;
    const headers = [
      'Chat ID',
      'Customer ID',
      'Customer Name (ชื่อลูกค้า)',
      'Customer History (ประวัติลูกค้า)',
      'Category (หมวดหมู่ภาษาไทย)',
      'Priority (ระดับความด่วน)',
      'Status (สถานะ)',
      'Issue Count (จำนวนเรื่อง)',
      'Audit Override (การแก้ไขโดยแอดมิน)',
      'AI Summary (ข้อสรุปปัญหา)',
      'Tags (ป้ายกำกับ)',
      'Full Conversation (บทสนทนา)',
      'Created At (วันเวลา)'
    ];
    const rows = filteredChats.map(c => {
      const foundCat = categories.find((cat: any) => cat.id === c.category_id || getBaseCatId(cat.id) === getBaseCatId(c.category_id));
      let catName = foundCat ? foundCat.name : '';
      if (!catName) {
        const base = getBaseCatId(c.category_id);
        if (base === 'page_load_freeze' || base === 'ui_rendering_issue') catName = 'หน้าเว็บค้าง / โหลดหมุน';
        else if (base === 'deposit_withdrawal') catName = 'ฝากถอนเงิน / โอนเงิน';
        else if (base === 'login_issue') catName = 'เข้าใช้งาน / เข้าสู่ระบบ';
        else if (base === 'game_issue' || base === 'gameplay_issue') catName = 'ปัญหาเกม / ระบบเดิมพัน';
        else if (base === 'promo_bonus') catName = 'โปรโมชั่น / โบนัส';
        else if (base === 'account_security') catName = 'ความปลอดภัยของบัญชี';
        else if (base === 'api_error') catName = 'ข้อผิดพลาดระบบ API';
        else catName = c.category_id || 'อื่นๆ';
      }

      const custName = c.customer_name || (
        c.customer_id === 'cust-003' ? 'Anan (อนันต์)' :
        c.customer_id === 'cust-001' ? 'Somchai (สมชาย)' :
        c.customer_id === 'cust-002' ? 'Somsri (สมศรี)' :
        `ลูกค้า #${c.customer_id || c.id?.substring(0, 8)}`
      );

      const repeatCount = chats.filter(item => 
        (c.customer_id && item.customer_id === c.customer_id) ||
        (c.customer_name && item.customer_name === c.customer_name) ||
        item.id === c.id
      ).length;
      const historyStr = repeatCount > 1 ? `ทักซ้ำ ${repeatCount} เคส` : 'ทักครั้งแรก';

      const tagsStr = (c.tags || []).join(' ');
      const summaryText = (c.summary || c.problem_summary || '').replace(/\n/g, ' ');
      const convText = (typeof c.conversation === 'string' ? c.conversation : (c.rawMessages ? c.rawMessages.join('\n') : summaryText)).replace(/\n/g, ' ');
      const statusLabel = c.status === 'completed' || c.status === 'solved' ? 'แยกแยะแล้ว (Completed)' : 'รอดำเนินการ (Pending)';
      const issueCount = c.chat_issues ? `${c.chat_issues.length} เรื่อง` : '1 เรื่อง';
      
      let auditLogStr = 'ยืนยันตาม AI';
      try {
        if (c.resolution && c.resolution !== 'Pending' && c.resolution !== 'Solved') {
          const parsed = JSON.parse(c.resolution);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const last = parsed[parsed.length - 1];
            auditLogStr = `แก้ไขโดย ${last.user || 'แอดมิน'} (${last.action || 'Manual Edit'})`;
          }
        }
      } catch (e) {}

      const formattedDate = c.created_at ? new Date(c.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : '';

      return [
        `"${c.id || ''}"`,
        `"${c.customer_id || ''}"`,
        `"${(custName).replace(/"/g, '""')}"`,
        `"${historyStr}"`,
        `"${(catName).replace(/"/g, '""')}"`,
        `"${(c.priority || '').toUpperCase()}"`,
        `"${statusLabel}"`,
        `"${issueCount}"`,
        `"${auditLogStr}"`,
        `"${summaryText.replace(/"/g, '""')}"`,
        `"${tagsStr.replace(/"/g, '""')}"`,
        `"${convText.replace(/"/g, '""')}"`,
        `"${formattedDate}"`
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-triage-${dateFilter}-${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };



  // Bulk update API call
  const handleBulkUpdate = async (categoryId: string | null | undefined, status: string | undefined) => {
    setLoading(true);
    try {
      const res = await fetch('/api/chats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selectedIds,
          category_id: categoryId,
          status: status
        })
      });
      if (!res.ok) throw new Error('Bulk update failed');

      // 📜 Record to Audit & Activity Logs
      for (const id of selectedIds) {
        const detailMsg = status 
          ? `อัปเดตสถานะแชตแบบกลุ่ม #${id} เป็น [${status === 'completed' ? 'แยกแยะแล้ว' : 'รอดำเนินการ'}]`
          : `ย้ายหมวดหมู่แชตแบบกลุ่ม #${id} เป็น [${categoryId}]`;
        await logActivityTrail('BULK_UPDATE', id, 'multiple_chats', detailMsg);
      }

      await fetchInitialData();
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      alert(language === 'th' ? 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' : 'Error updating data');
    } finally {
      setLoading(false);
    }
  };

  // Toggle selection handlers
  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredChats.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredChats.map(c => c.id));
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('chats_sound_enabled', String(next));
  };

  // Initialize dates and sound state with synchronization
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formattedToday = year + '-' + month + '-' + day;
    setStartDate(formattedToday);
    setEndDate(formattedToday);

    const savedSound = isSoundEnabled();
    setSoundEnabled(savedSound);

    // Sync sound setting changes from other tabs or pages (e.g. Dashboard)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chats_sound_enabled') {
        setSoundEnabled(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 🔔 Task 1: Supabase Realtime Listener (Live Chat Updates)
  useEffect(() => {
    const channel = supabase
      .channel('realtime-chats-chats-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => {
        fetchInitialData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_issues' }, () => {
        fetchInitialData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 📜 Task 4: Activity Log Trail helper for activity_logs table
  const logActivityTrail = async (actionType: string, selectedChatId: string, oldValue: any, newValue: any) => {
    try {
      const user = userProfile || {
        id: 'admin-01',
        name: 'Admin',
        company_id: '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2'
      };

      const logPayload = {
        company_id: user.company_id || user.companyId || '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2',
        user_id: user.id || 'admin-01',
        user_name: user.name || 'Admin',
        action_type: actionType,
        details: { chat_id: selectedChatId, old_value: oldValue, new_value: newValue }
      };

      // 1. Direct Supabase insert to activity_logs
      try {
        await supabase.from('activity_logs').insert([logPayload]);
      } catch (err) {
        console.warn('activity_logs insert warning:', err);
      }

      // 2. API proxy insert
      try {
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            admin_name: user.name || 'Admin',
            admin_email: user.email || 'admin@aitriage.com',
            action: actionType,
            ...logPayload
          })
        });
      } catch (err) {
        console.error('Audit log API error:', err);
      }
    } catch (e) {
      console.error('Error logging activity trail:', e);
    }
  };

  useEffect(() => {
    fetchInitialData();
    const savedSession = localStorage.getItem('user_session');
    if (savedSession) {
      try {
        setUserProfile(JSON.parse(savedSession));
      } catch (e) {}
    }
  }, []);

  const previousChatsRef = useRef<Map<string, string>>(new Map());

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const matchCookie = typeof document !== 'undefined' ? document.cookie.match(/(?:^|; )company_id=([^;]*)/) : null;
      const compId = matchCookie ? decodeURIComponent(matchCookie[1]) : (typeof localStorage !== 'undefined' ? localStorage.getItem('company_id') || '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2' : '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2');
      setActiveCompanyId(compId);

      const [catRes, chatsRes] = await Promise.all([
        fetch(`/api/categories?company_id=${compId}`),
        fetch(`/api/chats?summary_only=true&company_id=${compId}&nocache=${Date.now()}`)
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }

      if (chatsRes.ok) {
        const chatsData = await chatsRes.json();
        if (chatsData) {
          const processed = chatsData.map((c: any) => ({
            ...c,
            status: c.status === 'completed' ? 'completed' : 'pending'
          }));
          const sorted = [...processed].sort((a, b) => 
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );

          // Automated Sound & Notification trigger for NEW Urgent/High cases
          let hasNewUrgentOrHigh = false;
          let latestUrgentChat: any = null;

          sorted.forEach((c: any) => {
            const pri = (c.priority || 'low').toLowerCase();
            const prevPri = previousChatsRef.current.get(c.id);
            if (!prevPri && (pri === 'urgent' || pri === 'high')) {
              hasNewUrgentOrHigh = true;
              latestUrgentChat = c;
            } else if (prevPri && prevPri !== pri && (pri === 'urgent' || pri === 'high')) {
              hasNewUrgentOrHigh = true;
              latestUrgentChat = c;
            }
            previousChatsRef.current.set(c.id, pri);
          });

          // Trigger sound if new Urgent/High cases detected
          if (hasNewUrgentOrHigh && previousChatsRef.current.size > sorted.length) {
            playAlertTone(undefined, undefined, false);
            if (desktopNotifyEnabled && latestUrgentChat) {
              try {
                new Notification('🚨 เคสด่วนที่สุดยิงเข้ามาใหม่!', {
                  body: `ลูกค้า ${latestUrgentChat.customer_name || latestUrgentChat.id}: ${latestUrgentChat.summary || 'ต้องการการช่วยเหลือด่วน'}`,
                  icon: '/favicon.ico'
                });
              } catch (e) {}
            }
          }

          setChats(sorted);
          setFilteredChats(sorted);
        }
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Parse URL query parameters from dashboard links
  useEffect(() => {
    if (chats.length > 0) {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const statusParam = params.get('status');
        const priorityParam = params.get('priority');
        const categoryParam = params.get('category');
        const auditParam = params.get('audit');
        const dateParam = params.get('dateRange') || params.get('timeframe') || params.get('dateFilter');

        if (statusParam) setStatusFilter(statusParam);
        if (priorityParam) setPriorityFilter(priorityParam);
        if (categoryParam) setCategoryFilter(categoryParam);
        if (auditParam) setAuditFilter(auditParam);
        if (dateParam) setDateFilter(dateParam);
      }
    }
  }, [chats]);

  // Apply filters
  useEffect(() => {
    let result = chats;

    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(c => {
        const nameMatch = c.customer_name?.toLowerCase().includes(q);
        const idMatch = c.id?.toLowerCase().includes(q) || c.customer_id?.toLowerCase().includes(q);
        const summaryMatch = (c.summary || c.problem_summary)?.toLowerCase().includes(q);
        const conversationMatch = typeof c.conversation === 'string' 
          ? c.conversation.toLowerCase().includes(q) 
          : JSON.stringify(c.conversation || '').toLowerCase().includes(q);
        const tagsMatch = c.tags?.some((t: string) => t.toLowerCase().includes(q));

        return nameMatch || idMatch || summaryMatch || conversationMatch || tagsMatch;
      });
    }

    if (statusFilter !== 'all') {
      result = result.filter(c => {
        const status = c.status || 'pending';
        return status === statusFilter;
      });
    }

    if (priorityFilter !== 'all') {
      result = result.filter(c => {
        const pri = c.priority?.toLowerCase() || 'low';
        let issueMatch = false;
        if (c.chat_issues && c.chat_issues.length > 0) {
          issueMatch = c.chat_issues.some((issue: any) => {
            const ipri = issue.priority?.toLowerCase();
            if (priorityFilter === 'urgent') return ipri === 'urgent' || ipri === 'high';
            return ipri === priorityFilter;
          });
        }

        if (priorityFilter === 'urgent') {
          return pri === 'urgent' || pri === 'high' || issueMatch;
        }
        return pri === priorityFilter || issueMatch;
      });
    }

    if (categoryFilter !== 'all') {
      result = result.filter(c => {
        if (c.chat_issues && c.chat_issues.length > 0) {
          return c.chat_issues.some((issue: any) => issue.category_id === categoryFilter);
        }
        return c.category_id === categoryFilter;
      });
    }

    if (tagFilter !== 'all') {
      result = result.filter(c => {
        const tags = c.tags || [];
        return tags.includes(tagFilter);
      });
    }

    // Filter by Date Range (Bulletproof YYYY-MM-DD comparison - No timezone bugs!)
    // Strict Date Filtering (Asia/Bangkok local date comparison)
    const todayLocalStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });

    if (dateFilter === 'today') {
      result = result.filter(c => {
        if (!c.created_at) return false;
        const itemDateStr = new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
        return itemDateStr === todayLocalStr;
      });
    } else if (dateFilter === '7days') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const cutoffStr = cutoff.toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
      result = result.filter(c => {
        if (!c.created_at) return false;
        const itemDateStr = new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
        return itemDateStr >= cutoffStr;
      });
    } else if (dateFilter === '30days') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 60);
      const cutoffStr = cutoff.toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
      result = result.filter(c => {
        if (!c.created_at) return false;
        const itemDateStr = new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
        return itemDateStr >= cutoffStr;
      });
    } else if (dateFilter === 'custom') {
      if (startDate) {
        result = result.filter(c => {
          if (!c.created_at) return false;
          const itemDateStr = new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
          return itemDateStr >= startDate;
        });
      }
      if (endDate) {
        result = result.filter(c => {
          if (!c.created_at) return false;
          const itemDateStr = new Date(c.created_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
          return itemDateStr <= endDate;
        });
      }
    }

    if (auditFilter !== 'all') {
      result = result.filter(c => {
        let hasOverride = false;
        try {
          if (c.resolution && c.resolution !== 'Pending' && c.resolution !== 'Solved') {
            const history = JSON.parse(c.resolution);
            if (Array.isArray(history)) {
              hasOverride = history.some((log) => 
                log.old_category !== log.new_category || 
                log.old_priority !== log.new_priority
              );
            }
          }
        } catch (e) {}
        
        if (auditFilter === 'confirmed') {
          return !hasOverride;
        } else if (auditFilter === 'corrected') {
          return hasOverride;
        }
        return true;
      });
    }

    setFilteredChats(result);
  }, [searchQuery, statusFilter, priorityFilter, categoryFilter, dateFilter, startDate, endDate, auditFilter, chats]);

  // Open / bring to front a floating window
  const handleSelectChat = (chat: any) => {
    const existing = activeWindows.find(w => w.id === chat.id);
    const newZ = maxZIndex + 1;
    setMaxZIndex(newZ);

    if (existing) {
      // Just bring to front and focus
      setActiveWindows(prev => prev.map(w => w.id === chat.id ? { ...w, zIndex: newZ } : w));
      return;
    }

    // Stagger initial window position cleanly
    const offset = (activeWindows.length % 5) * 25;
    const initialX = typeof window !== 'undefined' ? Math.max(20, Math.min(window.innerWidth - 780, 120 + offset)) : 120;
    const initialY = 90 + offset;

    const newWin = {
      id: chat.id,
      chat,
      x: initialX,
      y: initialY,
      zIndex: newZ
    };

    setActiveWindows(prev => [...prev, newWin]);

    // Fetch full untruncated conversation history for this single chat on-demand
    fetch(`/api/chats?id=${chat.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const fullChat = data.find((c: any) => c.id === chat.id) || data[0];
          if (fullChat) {
            setActiveWindows(prev => prev.map(w => {
              if (w.id === chat.id) {
                return { ...w, chat: { ...w.chat, ...fullChat } };
              }
              return w;
            }));
          }
        }
      })
      .catch(err => console.error('Error fetching full chat details:', err));
  };



  const isAllSelected = filteredChats.length > 0 && selectedIds.length === filteredChats.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < filteredChats.length;

  return (
    <div className="h-full flex flex-col gap-6 relative">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight font-display">{t('chatsTitle')}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('chatsSub')}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Desktop Web Notification Control */}
          <button
            onClick={handleToggleDesktopNotification}
            className={`flex items-center gap-2 border px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
              desktopNotifyEnabled
                ? 'bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-955/20 dark:border-sky-900/50 dark:text-sky-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-855'
            }`}
            title="เปิด/ปิดการแจ้งเตือนป๊อปอัพหน้าจอคอมพิวเตอร์"
          >
            {desktopNotifyEnabled ? '💻 ป๊อปอัพหน้าจอ: เปิด' : '💻 ป๊อปอัพหน้าจอ: ปิด'}
          </button>

          {/* Sound Alert Control Group */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                localStorage.setItem('chats_sound_enabled', String(next));
                if (next) {
                  playAlertTone(undefined, undefined, true);
                }
              }}
              className={`flex items-center gap-2 border px-3.5 py-2.5 rounded-l-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm ${
                soundEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-emerald-600/20 dark:bg-emerald-600 dark:border-emerald-500'
                  : 'bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-250 dark:border-slate-750'
              }`}
              title={soundEnabled ? 'ปิดเสียงแจ้งเตือนเคสด่วนที่สุด' : 'เปิดเสียงแจ้งเตือนเคสด่วนที่สุด'}
            >
              {soundEnabled ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  <span>🔔 เสียงเคสด่วน: เปิด</span>
                </>
              ) : (
                <span>🔕 เสียงเคสด่วน: ปิด</span>
              )}
            </button>
            <button
              onClick={() => setShowSoundModal(true)}
              className={`border-y border-r px-2.5 py-2.5 rounded-r-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                soundEnabled
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-600 dark:bg-emerald-700 dark:border-emerald-600'
                  : 'bg-slate-150 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 dark:text-slate-400 border-slate-250 dark:border-slate-750'
              }`}
              title="ตั้งค่ารูปแบบเสียงแจ้งเตือน ความดัง และทดสอบเปิดเสียง"
            >
              ⚙️
            </button>
          </div>

          <SoundSettingsModal
            isOpen={showSoundModal}
            onClose={() => setShowSoundModal(false)}
            onSettingsChanged={() => {
              const savedSound = localStorage.getItem('chats_sound_enabled') === 'true';
              setSoundEnabled(savedSound);
            }}
          />
          
          <LanguageToggle />
        </div>
      </div>

      {/* ================= LIST VIEW ================= */}
      <div className="space-y-6">
        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col gap-4 transition-all duration-250">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-start">
            {/* Search with keyboard shortcut hint */}
            <div className="relative w-full text-slate-800 dark:text-slate-100">
              <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t('filterSearch')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl pl-10 pr-12 py-2.5 text-sm focus:border-indigo-600 focus:outline-none transition font-semibold text-slate-800 dark:text-slate-100"
              />
              <span className="absolute right-3 top-3 text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-slate-750 px-1.5 py-0.5 rounded border border-slate-300/60 dark:border-slate-700 pointer-events-none">
                /
              </span>
            </div>

            {/* Status with Badge Counters */}
            <div className="w-full">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm font-semibold focus:border-indigo-600 focus:outline-none transition text-slate-855 dark:text-slate-100"
              >
                <option value="all">{t('filterStatus')}</option>
                <option value="pending">{t('filterPending')} ({pendingCount})</option>
                <option value="completed">{t('filterCompleted')} ({completedCount})</option>
              </select>
            </div>

            {/* Priority with Badge Counters */}
            <div className="w-full">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm font-semibold focus:border-indigo-600 focus:outline-none transition text-slate-855 dark:text-slate-100"
              >
                <option value="all">{t('filterPriority')}</option>
                <option value="urgent">Urgent (ด่วนที่สุด) ({urgentCount})</option>
                <option value="high">High (ด่วนสูง) ({highCount})</option>
                <option value="medium">Medium (ด่วนปานกลาง) ({mediumCount})</option>
                <option value="low">Low (ด่วนน้อย) ({lowCount})</option>
              </select>
            </div>

          {/* Category */}
          <div className="w-full">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm font-semibold focus:border-indigo-600 focus:outline-none transition text-slate-855 dark:text-slate-100"
            >
              <option value="all">{t('filterCategory')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{formatCategoryLabel(cat.name, language)}</option>
              ))}
            </select>
          </div>

          {/* Tag Filter Dropdown */}
          <div className="w-full">
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm font-semibold focus:border-indigo-600 focus:outline-none transition text-slate-855 dark:text-slate-100"
            >
              <option value="all">🏷️ แท็ก: ทั้งหมด</option>
              {allAvailableTags.map((tagObj) => (
                <option key={tagObj.name} value={tagObj.name}>
                  {tagObj.name} ({tagObj.desc})
                </option>
              ))}
            </select>
          </div>

          {/* Audit Filter */}
          <div className="w-full">
            <select
              value={auditFilter}
              onChange={(e) => setAuditFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm font-semibold focus:border-indigo-600 focus:outline-none transition text-slate-855 dark:text-slate-100"
            >
              <option value="all">{t('filterAiAudit')}</option>
              <option value="confirmed">{t('filterConfirmed')}</option>
              <option value="corrected">{t('filterCorrected')}</option>
            </select>
          </div>
        </div>

        {/* Row 2: Date Filter & Quick Filter Pills */}
        <div className="flex flex-col gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Timeframe Filter Dropdown */}
              <div className="w-[200px]">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm font-semibold focus:border-indigo-600 focus:outline-none transition text-slate-855 dark:text-slate-100"
                >
                  <option value="today">{language === 'th' ? 'ช่วงเวลา: วันนี้' : 'Timeframe: Today'}</option>
                  <option value="7days">{language === 'th' ? 'ช่วงเวลา: 7 วันล่าสุด' : 'Timeframe: Last 7 Days'}</option>
                  <option value="30days">{language === 'th' ? 'ช่วงเวลา: 30 วันล่าสุด' : 'Timeframe: Last 30 Days'}</option>
                  <option value="custom">{language === 'th' ? 'ระบุช่วงวันที่เอง...' : 'Custom Range...'}</option>
                </select>
              </div>

              {dateFilter === 'custom' && (
                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-555 bg-slate-50 dark:bg-slate-855/50 p-2 rounded-xl border border-slate-150 dark:border-slate-800">
                  <div className="flex items-center gap-1">
                    <span className="font-bold">{language === 'th' ? 'จาก:' : 'From:'}</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs font-semibold focus:border-indigo-600 focus:outline-none transition text-slate-800 dark:text-slate-100 w-[130px]"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold">{language === 'th' ? 'ถึง:' : 'To:'}</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs font-semibold focus:border-indigo-600 focus:outline-none transition text-slate-800 dark:text-slate-100 w-[130px]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recommendation #3: Active Filter Chips Bar */}
        {isAnyFilterActive && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-semibold mr-1">
                {language === 'th' ? `ฟิลเตอร์ที่เปิดใช้งานอยู่ (` : 'Active Filters ('}
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{filteredChats.length}</span>
                {language === 'th' ? ` รายการ):` : ` results):`}
              </span>

              {searchQuery && (
                <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-lg border border-slate-250 dark:border-slate-700 font-bold text-[11px]">
                  🔍 {searchQuery}
                  <button type="button" onClick={() => setSearchQuery('')} className="hover:text-rose-500 font-extrabold ml-1 cursor-pointer">✕</button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-955/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-900/50 font-bold text-[11px]">
                  ⏳ {statusFilter === 'pending' ? 'รอดำเนินการ' : 'แยกแยะแล้ว'}
                  <button type="button" onClick={() => setStatusFilter('all')} className="hover:text-rose-500 font-extrabold ml-1 cursor-pointer">✕</button>
                </span>
              )}
              {priorityFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-955/40 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-900/50 font-bold text-[11px]">
                  🔴 {priorityFilter.toUpperCase()}
                  <button type="button" onClick={() => setPriorityFilter('all')} className="hover:text-rose-500 font-extrabold ml-1 cursor-pointer">✕</button>
                </span>
              )}
              {categoryFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-sky-50 dark:bg-sky-955/40 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-lg border border-sky-200 dark:border-sky-900/50 font-bold text-[11px]">
                  📌 {categories.find((c: any) => c.id === categoryFilter)?.name || categoryFilter}
                  <button type="button" onClick={() => setCategoryFilter('all')} className="hover:text-rose-500 font-extrabold ml-1 cursor-pointer">✕</button>
                </span>
              )}
              {tagFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-955/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-900/50 font-bold text-[11px]">
                  🏷️ {tagFilter}
                  <button type="button" onClick={() => setTagFilter('all')} className="hover:text-rose-500 font-extrabold ml-1 cursor-pointer">✕</button>
                </span>
              )}
              {dateFilter !== 'today' && (
                <span className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-955/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-lg border border-purple-200 dark:border-purple-900/50 font-bold text-[11px]">
                  📅 {dateFilter === '7days' ? '7 วันล่าสุด' : dateFilter === '30days' ? '30 วันล่าสุด' : dateFilter === 'all' ? 'ทั้งหมด' : 'กำหนดเอง'}
                  <button type="button" onClick={() => setDateFilter('today')} className="hover:text-rose-500 font-extrabold ml-1 cursor-pointer">✕</button>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold bg-rose-50 dark:bg-rose-955/30 px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-900/40 transition cursor-pointer shrink-0"
            >
              <RotateCcw size={12} />
              <span>{language === 'th' ? 'ล้างตัวกรองทั้งหมด' : 'Clear All Filters'}</span>
            </button>
          </div>
        )}
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-indigo-50/80 dark:bg-indigo-950/45 border border-indigo-150 dark:border-indigo-900/50 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in shadow-sm select-none backdrop-blur-sm mb-4">
            <div className="flex items-center gap-2">
              <span className="text-indigo-650 dark:text-indigo-400 font-extrabold text-sm">
                {language === 'th' ? `เลือกอยู่ ${selectedIds.length} เคส` : `Selected ${selectedIds.length} cases`}
              </span>
              <button 
                onClick={() => setSelectedIds([])}
                className="text-xs font-bold text-slate-500 dark:text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 underline cursor-pointer"
              >
                {language === 'th' ? 'ยกเลิกทั้งหมด' : 'Deselect all'}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleBulkUpdate(undefined, 'completed')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle size={14} /> {language === 'th' ? 'ทำเครื่องหมายว่าแยกแยะแล้ว' : 'Mark as Completed'}
              </button>
              
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkUpdate(e.target.value, undefined);
                      e.target.value = ''; // reset selection
                    }
                  }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 px-3 py-2.5 rounded-xl cursor-pointer focus:outline-none"
                >
                  <option value="">{language === 'th' ? '-- ย้ายหมวดหมู่แชต --' : '-- Batch Move Category --'}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{formatCategoryLabel(cat.name, language)}</option>
                  ))}
                  <option value="other">{language === 'th' ? 'อื่นๆ (Other)' : 'Other'}</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* List Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-250">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400 dark:text-slate-555">
              <RefreshCw size={32} className="animate-spin text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-semibold">{t('loadingChats')}</span>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-20 text-center text-slate-400 dark:text-slate-555 text-sm flex flex-col items-center justify-center gap-3">
              <MessageSquare size={36} className="text-slate-300 dark:text-slate-700" />
              <span>{t('noChatsFound')}</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-855/50 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                    <th className="px-3 py-3.5 w-10 text-center select-none">
                      <input 
                        type="checkbox" 
                        checked={isAllSelected}
                        ref={el => {
                          if (el) el.indeterminate = isSomeSelected;
                        }}
                        onChange={handleToggleSelectAll}
                        className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-slate-700 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-1.5 py-2.5 whitespace-nowrap">
                      <div className="flex flex-col leading-tight">
                        <span>{language === 'th' ? 'แชทไอดี' : 'Chat ID'}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">(Chat ID)</span>
                      </div>
                    </th>
                    <th className="px-1.5 py-2.5 whitespace-nowrap">
                      <div className="flex flex-col leading-tight">
                        <span>{language === 'th' ? 'ลูกค้า' : 'Customer'}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">(Customer)</span>
                      </div>
                    </th>
                    <th className="px-2 py-2.5 max-w-[200px]">
                      <div className="flex flex-col leading-tight">
                        <span>{language === 'th' ? 'ข้อสรุปปัญหา' : 'AI Summary'}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">(AI Summary)</span>
                      </div>
                    </th>
                    <th className="px-1.5 py-2.5 whitespace-nowrap">
                      <div className="flex flex-col leading-tight">
                        <span>{language === 'th' ? 'หมวดหมู่' : 'Category'}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">(Category)</span>
                      </div>
                    </th>
                    <th className="px-1.5 py-2.5 whitespace-nowrap text-center">
                      <div className="flex flex-col leading-tight items-center">
                        <span>{language === 'th' ? 'ความด่วน' : 'Priority'}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">(Priority)</span>
                      </div>
                    </th>
                    <th className="px-1.5 py-2.5 whitespace-nowrap text-center">
                      <div className="flex flex-col leading-tight items-center">
                        <span>{language === 'th' ? 'สถานะ' : 'Status'}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">(Status)</span>
                      </div>
                    </th>
                    <th className="px-2.5 py-2.5 w-[105px] min-w-[105px] whitespace-nowrap text-right">
                      <div className="flex flex-col leading-tight items-end">
                        <span>{language === 'th' ? 'เวลา' : 'Time'}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">(Time)</span>
                      </div>
                    </th>
                    <th className="px-1 py-2.5 w-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredChats.map((chat) => {
                    const isSelected = activeWindows.some(w => w.id === chat.id);
                    const isChecked = selectedIds.includes(chat.id);
                    return (
                      <tr 
                        key={chat.id} 
                        onClick={() => handleSelectChat(chat)}
                        className={'hover:bg-slate-50 dark:hover:bg-slate-855/50 transition-colors cursor-pointer group ' + (isSelected ? 'bg-indigo-50/20 dark:bg-indigo-955/10 font-bold' : '') + (isChecked ? ' bg-indigo-50/10 dark:bg-indigo-955/5' : '')}
                      >
                        {/* Checkbox */}
                        <td className="px-2 py-3 w-8 text-center" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={(e) => handleToggleSelect(chat.id, e as any)}
                            className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-slate-700 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>

                        {/* Chat ID */}
                        <td className="px-2 py-3 font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {chat.id}
                        </td>

                        {/* Customer */}
                        <td className="px-2 py-3 font-bold text-slate-800 dark:text-slate-200">
                          <div>
                            {chat.customer_name || ('ลูกค้า #' + (chat.customer_id || chat.id?.substring(0, 8)))}
                          </div>
                          {chat.tags && chat.tags.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap mt-1 select-none">
                              {chat.tags.map((tag: string, tidx: number) => {
                                let badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800';
                                if (tag === '#VIP') badgeColor = 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-955/30 dark:text-purple-300 dark:border-purple-900/50';
                                else if (tag === '#ติดตามผล') badgeColor = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-955/30 dark:text-amber-300 dark:border-amber-900/50';
                                else if (tag === '#รอสลิป') badgeColor = 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-955/30 dark:text-sky-300 dark:border-sky-900/50';
                                else if (tag === '#ส่งเรื่องทีมเทคนิค') badgeColor = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-955/30 dark:text-rose-300 dark:border-rose-900/50';
                                else if (tag === '#รอธนาคารแก้ไข') badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-955/30 dark:text-emerald-300 dark:border-emerald-900/50';
                                
                                return (
                                  <span key={tidx} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${badgeColor}`}>
                                    {tag}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        
                        {/* Summary */}
                        <td className="px-2 py-3 max-w-[190px] text-slate-600 dark:text-slate-300 font-medium">
                          <span className="truncate block">{chat.summary || <span className="text-slate-400 dark:text-slate-555 italic">{language === 'th' ? 'ไม่มีข้อมูลสรุป' : 'No summary'}</span>}</span>
                        </td>

                        {/* Category */}
                        <td className="px-1.5 py-2.5 whitespace-nowrap">
                          <div className="flex flex-col items-start gap-1">
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold px-2 py-0.5 rounded-lg truncate max-w-[170px]">
                              {(() => {
                                const found = categories.find(c => c.id === chat.category_id || getBaseCatId(c.id) === getBaseCatId(chat.category_id));
                                if (found) return formatCategoryLabel(found.name, language);
                                const base = getBaseCatId(chat.category_id);
                                if (base === 'page_load_freeze' || base === 'ui_rendering_issue') return 'หน้าเว็บค้าง / โหลดหมุน';
                                if (base === 'deposit_withdrawal') return 'ฝากถอนเงิน / โอนเงิน';
                                if (base === 'login_issue') return 'เข้าใช้งาน / เข้าสู่ระบบ';
                                if (base === 'game_issue' || base === 'gameplay_issue') return 'ปัญหาเกม / ระบบเดิมพัน';
                                if (base === 'promo_bonus') return 'โปรโมชั่น / โบนัส';
                                if (base === 'account_security') return 'ความปลอดภัยของบัญชี';
                                if (base === 'api_error') return 'ข้อผิดพลาดระบบ API';
                                return chat.category_id || 'อื่นๆ';
                              })()}
                            </span>
                            {chat.chat_issues && chat.chat_issues.length > 1 && (
                              <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold px-1.5 py-0.2 rounded-md border border-indigo-100/60 dark:border-indigo-900/40 shrink-0 leading-none">
                                +{chat.chat_issues.length - 1} เรื่อง
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="px-2 py-3 text-center">
                          {(() => {
                            const pri = chat.priority?.toLowerCase() || 'low';
                            if (pri === 'urgent') {
                              return (
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-955/30 dark:text-rose-400 dark:border-rose-900/50 shadow-sm">
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                  </span>
                                  urgent
                                </span>
                              );
                            }

                            let styles = 'bg-slate-55 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
                            if (pri === 'high') styles = 'bg-orange-50 text-orange-655 border border-orange-100 dark:bg-orange-955/30 dark:text-orange-400';
                            else if (pri === 'medium') styles = 'bg-amber-50 text-amber-655 border-amber-200 dark:bg-amber-955/40 dark:text-amber-400';
                            else if (pri === 'low') styles = 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-955/30 dark:text-blue-455';
                            return (
                              <span className={'text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide ' + styles}>
                                {pri}
                              </span>
                            );
                          })()}
                        </td>

                        {/* Status with 1-Click Quick Toggle */}
                        <td className="px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleToggleSingleStatus(chat, e)}
                            className={'text-xs font-bold px-2.5 py-1 rounded-lg whitespace-nowrap border transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 flex items-center gap-1 ' + 
                              (chat.status === 'completed' 
                                ? 'bg-emerald-50 dark:bg-emerald-955/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                                : 'bg-amber-50 dark:bg-amber-955/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                              )
                            }
                            title="คลิกเพื่อสลับสถานะ (รอดำเนินการ ↔ แยกแยะแล้ว)"
                          >
                            {chat.status === 'completed' ? (language === 'th' ? '✅ แยกแยะแล้ว' : '✅ Completed') : (language === 'th' ? '⏳ รอดำเนินการ' : '⏳ Pending')}
                          </button>
                        </td>

                        {/* Time */}
                        <td className="px-2 py-3 text-xs text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap text-right">
                          {chat.created_at ? (
                            <div className="flex flex-col items-end leading-tight text-[11px]">
                              <span className="font-bold text-slate-700 dark:text-slate-200">
                                {new Date(chat.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'numeric', year: '2-digit' })}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                {new Date(chat.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                              </span>
                            </div>
                          ) : '-'}
                        </td>

                        {/* Action */}
                        <td className="px-2 py-3 text-center">
                          <ChevronRight size={18} className="text-slate-300 dark:text-slate-650 group-hover:text-indigo-650 group-hover:translate-x-1 transition-all" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ================= FLOATING CHAT WINDOWS RENDERER ================= */}
      {activeWindows.map((win) => (
        <FloatingChatWindow
          key={win.id}
          chat={win.chat}
          initialX={win.x}
          initialY={win.y}
          initialZIndex={win.zIndex}
          categories={categories}
          userProfile={userProfile}
          allChats={chats}
          onOpenChat={handleSelectChat}
          onClose={() => {
            setActiveWindows(prev => prev.filter(w => w.id !== win.id));
          }}
          onFocus={() => {
            const newZ = maxZIndex + 1;
            setMaxZIndex(newZ);
            setActiveWindows(prev => prev.map(w => w.id === win.id ? { ...w, zIndex: newZ } : w));
          }}
          onSaved={() => {
            fetchInitialData();
          }}
          onPositionChange={(newX: number, newY: number) => {
            setActiveWindows(prev => prev.map(w => w.id === win.id ? { ...w, x: newX, y: newY } : w));
          }}
          onUpdateTags={handleUpdateTags}
        />
      ))}

      {/* Global Tag Rename Modal */}
      {showTagRenameModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                ✏️ แก้ไขชื่อแท็กกลางทั่วทั้งระบบ
              </h3>
              <button
                onClick={() => setShowTagRenameModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                ระบบจะทำการเปลี่ยนชื่อแท็ก <span className="font-bold text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">{tagToRename}</span> สำหรับ <span className="font-bold text-rose-600">ทุกเคสลูกค้า</span> ที่ติดแท็กนี้อยู่ ให้เปลี่ยนเป็นชื่อใหม่พร้อมกันทันที:
              </p>

              <div>
                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  ชื่อแท็กใหม่
                </label>
                <input
                  type="text"
                  value={newGlobalTagName}
                  onChange={(e) => setNewGlobalTagName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm font-bold focus:border-indigo-600 focus:outline-none text-slate-800 dark:text-slate-100"
                  placeholder="เช่น #รอสลิปโอนเงิน..."
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowTagRenameModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleExecuteGlobalTagRename}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition cursor-pointer"
              >
                ✓ ยืนยันเปลี่ยนชื่อทุกเคส
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Manager Modal (Full system tags management) */}
      {showTagManagerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                ⚙️ จัดการและแก้ไขชื่อแท็กทั้งหมดในระบบ (Tag Manager)
              </h3>
              <button
                onClick={() => setShowTagManagerModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              คลิกปุ่ม <span className="font-bold text-indigo-600 dark:text-indigo-400">✏️ แก้ไขชื่อ</span> ด้านหลังแท็กที่ต้องการเปลี่ยน การเปลี่ยนชื่อแท็กตรงนี้จะทำการอัปเดตชื่อใหม่ให้ทุกเคสในระบบทันที:
            </p>

            <div className="space-y-2 max-h-[350px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {allAvailableTags.map((tagObj, idx) => {
                const isEditing = editingSystemTagIndex === idx;
                return (
                  <div key={idx} className="flex items-center justify-between py-2.5 gap-3">
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingSystemTagValue}
                          onChange={(e) => setEditingSystemTagValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRenameSystemTag(idx);
                            if (e.key === 'Escape') setEditingSystemTagIndex(null);
                          }}
                          className="flex-1 bg-slate-50 dark:bg-slate-850 border border-indigo-500 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveRenameSystemTag(idx)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm transition cursor-pointer"
                        >
                          บันทึก
                        </button>
                        <button
                          onClick={() => setEditingSystemTagIndex(null)}
                          className="text-xs font-bold text-slate-400 hover:text-slate-600 transition cursor-pointer"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${tagObj.style}`}>
                            {tagObj.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">({tagObj.desc})</span>
                        </div>
                        <button
                          onClick={() => {
                            setEditingSystemTagIndex(idx);
                            setEditingSystemTagValue(tagObj.name);
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 transition cursor-pointer shadow-sm"
                        >
                          ✏️ แก้ไขชื่อ
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowTagManagerModal(false)}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
