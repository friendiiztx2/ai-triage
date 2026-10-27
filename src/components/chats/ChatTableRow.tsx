import React, { useState } from 'react';
import {
  ChevronRight,
  Star,
  Image as ImageIcon,
  Check,
  Copy,
  Layers,
  Sparkles,
  CheckCircle2,
  PenLine,
} from 'lucide-react';
import { getCategoryLabel, getBaseCatId } from '@/lib/categories';
import { getChatAuditState } from '@/lib/chatFilters';
import ChatPriorityBadge from './table/ChatPriorityBadge';

export interface ChatTableRowProps {
  chat: any;
  categories: any[];
  isSelected: boolean;
  onSelectChat: (chat: any) => void;
  onHoverImg: (imgUrl: string | null) => void;
  onQuickApprove?: (chat: any) => Promise<void> | void;
  onQuickCategoryChange?: (chat: any, newCategoryId: string) => Promise<void> | void;
  language?: 'th' | 'en';
}

export default function ChatTableRow({
  chat,
  categories,
  isSelected,
  onSelectChat,
  onHoverImg,
  onQuickApprove,
  onQuickCategoryChange,
  language = 'th',
}: ChatTableRowProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [approving, setApproving] = useState(false);
  const [savingCat, setSavingCat] = useState(false);

  // Helper to extract first image URL
  const getFirstImageUrl = (c: any): string | null => {
    if (c?.media_urls && Array.isArray(c.media_urls) && c.media_urls.length > 0) {
      return c.media_urls[0];
    }
    const text =
      (typeof c?.conversation === 'string' ? c.conversation : '') +
      ' ' +
      (typeof c?.summary === 'string' ? c.summary : '');
    const match =
      text.match(/(https?:\/\/[^\s\n"']+\.(jpg|jpeg|png|webp|gif|svg)(\?[^\s\n"']*)?)/i) ||
      text.match(/(https?:\/\/[^\s\n"']*(images|photos|slip|storage)[^\s\n"']*)/i);
    return match ? match[1] || match[0] : null;
  };

  const isImgOnly =
    (chat.tags && chat.tags.includes('#รูปภาพล้วน')) ||
    (typeof chat.summary === 'string' &&
      (chat.summary.includes('รูปภาพล้วน') || chat.summary.includes('ไม่ระบุข้อความพิมพ์')));
  const firstImg = getFirstImageUrl(chat);

  const prioNorm = (chat.priority || 'low').toLowerCase();
  const isUrgent = prioNorm === 'urgent' || prioNorm === 'critical';
  const isHigh = prioNorm === 'high';

  const auditState = getChatAuditState(chat);
  const issueCount = Array.isArray(chat.chat_issues) ? chat.chat_issues.length : 0;

  const currentBaseCat = getBaseCatId(chat.category_id || '');
  const matchedCatObj = categories.find(
    (c) => c.id === chat.category_id || getBaseCatId(c.id) === currentBaseCat
  );
  const currentCatLabel = getCategoryLabel(matchedCatObj || chat.category_id, language);

  const visibleTags = (chat.tags || []).filter(
    (t: string) =>
      t !== '#VIP' &&
      t !== '#รูปภาพ' &&
      t !== '#รูปภาพล้วน' &&
      t !== '#รูปภาพทั้งหมด' &&
      t !== '#รูปภาพแนบ'
  );

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!chat.id) return;
    navigator.clipboard.writeText(chat.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  };

  const handleQuickApproveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onQuickApprove || approving) return;
    setApproving(true);
    try {
      await onQuickApprove(chat);
    } finally {
      setApproving(false);
    }
  };

  const handleInlineCategorySelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const newCatId = e.target.value;
    if (!newCatId || !onQuickCategoryChange || savingCat) return;
    setSavingCat(true);
    try {
      await onQuickCategoryChange(chat, newCatId);
    } finally {
      setSavingCat(false);
    }
  };

  const formattedTime = chat.created_at
    ? new Date(chat.created_at).toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

  const formattedDate = chat.created_at
    ? new Date(chat.created_at).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
        day: 'numeric',
        month: 'short',
      })
    : '';

  return (
    <tr
      onClick={() => onSelectChat(chat)}
      className={`transition-colors duration-150 cursor-pointer group text-xs border-l-3 ${
        isSelected
          ? 'bg-blue-50/70 dark:bg-blue-950/30 border-l-[#1a73e8]'
          : isUrgent
          ? 'hover:bg-rose-50/40 dark:hover:bg-rose-950/20 border-l-[#d93025]'
          : isHigh
          ? 'hover:bg-orange-50/30 dark:hover:bg-orange-950/15 border-l-orange-500'
          : 'hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 border-l-transparent'
      }`}
    >
      {/* 1. Priority & Timestamp (Left-most for instant visual triage) */}
      <td className="px-3.5 py-3 whitespace-nowrap">
        <div className="flex flex-col items-start gap-1">
          <ChatPriorityBadge priority={chat.priority} />
          <span className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500 pl-0.5">
            {formattedDate ? `${formattedDate} • ${formattedTime}` : formattedTime}
          </span>
        </div>
      </td>

      {/* 2. Customer & Session ID (Consolidated) */}
      <td className="px-3.5 py-3 whitespace-nowrap">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-[140px]"
              title={chat.customer_name || chat.customer_id}
            >
              {chat.customer_name || 'ลูกค้า #' + (chat.customer_id || chat.id?.substring(0, 8))}
            </span>
            {chat.tags && chat.tags.includes('#VIP') && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold shrink-0">
                <Star size={9} className="fill-amber-400 text-amber-500" />
                <span>VIP</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
            <span title={chat.id}>
              #{chat.id && chat.id.length > 10 ? `${chat.id.slice(0, 6)}..${chat.id.slice(-4)}` : chat.id}
            </span>
            <button
              type="button"
              onClick={handleCopyId}
              className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5 rounded transition-opacity cursor-pointer"
              title={language === 'th' ? 'คัดลอกรหัสแชต' : 'Copy Session ID'}
            >
              {copiedId ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
            </button>
          </div>
        </div>
      </td>

      {/* 3. AI Summary, Media & Sub-issues */}
      <td className="px-3.5 py-3 max-w-[460px]">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Image-Only Badge */}
            {isImgOnly && firstImg && (
              <span
                onMouseEnter={() => onHoverImg(firstImg)}
                onMouseLeave={() => onHoverImg(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(firstImg, '_blank', 'noopener,noreferrer');
                }}
                className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 hover:bg-purple-100 text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 cursor-zoom-in transition-all shadow-2xs"
                title={
                  language === 'th'
                    ? 'รูปภาพล้วน (ชี้เมาส์เพื่อซูมดูรูป / คลิกเปิดรูปใหญ่)'
                    : 'Image only (Hover to preview / Click to open)'
                }
              >
                <ImageIcon size={10} className="text-purple-600 dark:text-purple-400" />
                <span>{language === 'th' ? 'รูปภาพล้วน' : 'Img only'}</span>
              </span>
            )}

            {/* Attached Image with Text Badge */}
            {firstImg && !isImgOnly && (
              <span
                onMouseEnter={() => onHoverImg(firstImg)}
                onMouseLeave={() => onHoverImg(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(firstImg, '_blank', 'noopener,noreferrer');
                }}
                className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 px-1.5 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 cursor-zoom-in shrink-0 transition-all shadow-2xs"
                title={
                  language === 'th'
                    ? 'มีรูปภาพแนบ (ชี้เมาส์เพื่อซูมดูรูป / คลิกเปิดรูปใหญ่)'
                    : 'Attached image (Hover to preview / Click to open)'
                }
              >
                <ImageIcon size={10} className="text-neutral-500 dark:text-neutral-400" />
                <span>{language === 'th' ? 'ดูรูป' : 'Image'}</span>
              </span>
            )}

            {/* Multi-issue Counter Badge */}
            {issueCount > 1 && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/60 px-1.5 py-0.5 rounded shrink-0"
                title={
                  language === 'th'
                    ? `AI แยกประเด็นในแชตนี้ออกเป็น ${issueCount} เรื่อง`
                    : `${issueCount} sub-issues detected`
                }
              >
                <Layers size={10} />
                <span>
                  {issueCount} {language === 'th' ? 'ประเด็น' : 'issues'}
                </span>
              </span>
            )}

            <span className="text-neutral-700 dark:text-neutral-200 font-medium truncate block">
              {chat.summary || (
                <span className="text-neutral-400 italic font-normal">
                  {language === 'th' ? 'ไม่มีข้อความสรุป' : 'No summary'}
                </span>
              )}
            </span>
          </div>

          {/* Inline Custom Tags if any */}
          {visibleTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {visibleTags.slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono px-1.5 py-0.1 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-700/60"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </td>

      {/* 4. Category (Inline Quick-Select Dropdown) */}
      <td
        className="px-3.5 py-3 whitespace-nowrap"
        onClick={(e) => e.stopPropagation()}
      >
        {onQuickCategoryChange && categories.length > 0 ? (
          <div className="relative inline-block max-w-[195px]">
            <select
              value={currentBaseCat}
              disabled={savingCat}
              onChange={handleInlineCategorySelect}
              className="w-full appearance-none bg-neutral-50/90 hover:bg-white dark:bg-neutral-800/70 dark:hover:bg-neutral-800 border border-neutral-200/90 dark:border-neutral-700/80 rounded-lg pl-2.5 pr-6 py-1 text-xs font-medium text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-[#1a73e8] cursor-pointer transition-colors truncate shadow-2xs disabled:opacity-50"
              title={language === 'th' ? 'คลิกเพื่อเปลี่ยนหมวดหมู่ด่วน' : 'Click to quick-change category'}
            >
              {!categories.some((c) => getBaseCatId(c.id) === currentBaseCat) && (
                <option value={currentBaseCat}>{currentCatLabel}</option>
              )}
              {categories.map((cat) => {
                const baseId = getBaseCatId(cat.id);
                const label =
                  language === 'en'
                    ? cat.name_en || getCategoryLabel(cat, 'en')
                    : cat.name_th || cat.name || getCategoryLabel(cat, 'th');
                return (
                  <option key={cat.id} value={baseId}>
                    {label}
                  </option>
                );
              })}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 text-[10px]">
              ▾
            </span>
          </div>
        ) : (
          <span className="text-neutral-800 dark:text-neutral-200 text-xs font-medium">
            {currentCatLabel}
          </span>
        )}
      </td>

      {/* 5. Triage Action (1-Click Approve or Review Badge + Open Window) */}
      <td className="px-3.5 py-3 whitespace-nowrap text-right">
        <div className="inline-flex items-center justify-end gap-2">
          {auditState === 'confirmed' ? (
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60"
              title={language === 'th' ? 'แอดมินยืนยันผลวิเคราะห์ตาม AI แล้ว' : 'Confirmed AI triage'}
            >
              <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'th' ? 'ยืนยันแล้ว' : 'Confirmed'}</span>
            </span>
          ) : auditState === 'corrected' ? (
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200/70 dark:border-violet-800/60"
              title={language === 'th' ? 'แอดมินแก้ไขหมวดหมู่/ความด่วนแล้ว' : 'Corrected by admin'}
            >
              <PenLine size={11} className="text-violet-600 dark:text-violet-400" />
              <span>{language === 'th' ? 'แก้หมวดแล้ว' : 'Edited'}</span>
            </span>
          ) : onQuickApprove ? (
            <button
              type="button"
              disabled={approving}
              onClick={handleQuickApproveClick}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-emerald-600 text-neutral-700 hover:text-white dark:bg-neutral-800 dark:hover:bg-emerald-600 dark:text-neutral-200 border border-neutral-200/90 hover:border-emerald-600 dark:border-neutral-700 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              title={
                language === 'th'
                  ? 'กดยืนยันผลวิเคราะห์ของ AI ทันทีใน 1 คลิก'
                  : '1-Click Confirm AI Triage'
              }
            >
              <Sparkles size={11} className="text-emerald-500 group-hover:text-current" />
              <span>
                {approving
                  ? language === 'th'
                    ? 'กำลังบันทึก...'
                    : 'Saving...'
                  : language === 'th'
                  ? '✓ ยืนยัน AI'
                  : '✓ Confirm'}
              </span>
            </button>
          ) : null}

          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-neutral-400 group-hover:text-neutral-900 group-hover:bg-neutral-200/60 dark:group-hover:text-white dark:group-hover:bg-neutral-700/60 transition-colors"
            title={language === 'th' ? 'คลิกเพื่อเปิดดูบทสนทนาเต็ม' : 'Open full chat conversation'}
          >
            <ChevronRight size={14} />
          </span>
        </div>
      </td>
    </tr>
  );
}
