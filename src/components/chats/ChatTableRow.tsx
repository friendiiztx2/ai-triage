import React, { useState } from 'react';
import { Star,
  Image as ImageIcon,
  Check,
  CheckCircle2,
  Edit3,
  Copy,
  Layers,
  ChevronDown,
  Loader2,
  AlertCircle,
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
  onQuickCategoryChange?: (chat: any, newCatId: string) => Promise<void> | void;
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
  const [isApproving, setIsApproving] = useState(false);
  const [isUpdatingCat, setIsUpdatingCat] = useState(false);

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

  const auditState = getChatAuditState(chat);
  const issueCount = Array.isArray(chat.chat_issues) ? chat.chat_issues.length : 0;

  // Custom visible tags (excluding system image/VIP tags already shown as dedicated badges)
  const visibleTags: string[] = Array.isArray(chat.tags)
    ? chat.tags.filter(
        (t: string) =>
          t !== '#VIP' &&
          t !== '#รูปภาพ' &&
          t !== '#รูปภาพล้วน' &&
          t !== '#รูปภาพทั้งหมด' &&
          t !== '#รูปภาพแนบ'
      )
    : [];

  // Format date & time compactly
  const formatTimestamp = (iso?: string) => {
    if (!iso) return { time: '-', date: '' };
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const date = isToday
      ? language === 'th'
        ? 'วันนี้'
        : 'Today'
      : d.toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
          day: 'numeric',
          month: 'short',
        });
    return { time, date };
  };

  const { time, date } = formatTimestamp(chat.created_at);
  const currentBaseCat = getBaseCatId(chat.category_id);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!chat.id) return;
    navigator.clipboard.writeText(chat.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  };

  const handleApproveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onQuickApprove || isApproving) return;
    setIsApproving(true);
    try {
      await onQuickApprove(chat);
    } finally {
      setIsApproving(false);
    }
  };

  const handleCategorySelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const newCatId = e.target.value;
    if (!onQuickCategoryChange || newCatId === currentBaseCat) return;
    setIsUpdatingCat(true);
    try {
      await onQuickCategoryChange(chat, newCatId);
    } finally {
      setIsUpdatingCat(false);
    }
  };

  const normPri = (chat.priority || '').toLowerCase();
  const hasUrgentIssue = Array.isArray(chat.chat_issues) && chat.chat_issues.some((iss: any) => (iss.priority || '').toLowerCase() === 'urgent' || (iss.priority || '').toLowerCase() === 'critical');
  const hasHighIssue = Array.isArray(chat.chat_issues) && chat.chat_issues.some((iss: any) => (iss.priority || '').toLowerCase() === 'high');

  const isUrgentRow = normPri === 'urgent' || normPri === 'critical' || hasUrgentIssue;
  const isHighRow = (!isUrgentRow && normPri === 'high') || hasHighIssue;

  return (
    <tr
      onClick={() => onSelectChat(chat)}
      className={`hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60 transition-colors duration-150 cursor-pointer group text-xs ${
        isSelected
          ? 'bg-blue-50/60 dark:bg-blue-950/40'
          : isUrgentRow && auditState === 'unverified'
          ? 'bg-rose-50/30 dark:bg-rose-950/15'
          : ''
      }`}
    >
      {/* 1. Priority & Timestamp with Visual Accent Border */}
      <td
        className={`pl-3.5 pr-3 py-3.5 whitespace-nowrap border-l-4 ${
          isUrgentRow
            ? 'border-l-rose-500'
            : isHighRow
            ? 'border-l-amber-500'
            : 'border-l-transparent'
        }`}
      >
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-1.5">
            <ChatPriorityBadge priority={isUrgentRow ? 'urgent' : chat.priority} />
            {isUrgentRow && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px] text-neutral-400 dark:text-neutral-500 pl-0.5">
            <span>{date}</span>
            {date && <span>•</span>}
            <span className="text-neutral-600 dark:text-neutral-400 font-medium">{time}</span>
          </div>
        </div>
      </td>

      {/* 2. Customer & Session ID */}
      <td className="px-3 py-3.5 whitespace-nowrap">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="font-bold text-neutral-900 dark:text-neutral-100 truncate max-w-[185px]"
              title={chat.customer_name || chat.customer_id}
            >
              {chat.customer_name || 'ลูกค้า #' + (chat.customer_id || chat.id?.substring(0, 8))}
            </span>
            {chat.tags && chat.tags.includes('#VIP') && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold shrink-0">
                <Star size={8} className="fill-amber-400 text-amber-500" />
                <span>VIP</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span
              className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400 truncate max-w-[230px]"
              title={chat.id}
            >
              {language === 'th' ? 'ไอดี:' : 'ID:'} {chat.id}
            </span>
            <button
              type="button"
              onClick={handleCopyId}
              className="opacity-70 group-hover:opacity-100 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5 rounded transition-opacity cursor-pointer shrink-0"
              title={language === 'th' ? 'คัดลอกแชตไอดี' : 'Copy Session ID'}
            >
              {copiedId ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
            </button>
          </div>
        </div>
      </td>

      {/* 3. AI Summary, Media Preview & Issue Badges */}
      <td className="px-3 py-3.5 max-w-[460px]">
        <div className="flex flex-col gap-1 min-w-0">
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
                className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[10px] font-mono px-2 py-0.5 rounded-md border shrink-0 cursor-zoom-in transition-all shadow-2xs font-semibold"
                title={
                  language === 'th'
                    ? 'รูปภาพล้วน (ชี้เมาส์เพื่อดูรูป / คลิกเปิดรูปใหญ่)'
                    : 'Image only (Hover to preview / Click to open)'
                }
              >
                <ImageIcon size={11} className="text-purple-600 dark:text-purple-400" />
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
                className="inline-flex items-center gap-1 text-[10px] font-mono text-sky-700 hover:text-sky-900 dark:text-sky-300 dark:hover:text-sky-100 px-2 py-0.5 rounded-md bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/50 dark:hover:bg-sky-900/60 border border-sky-200/80 dark:border-sky-800/70 cursor-zoom-in shrink-0 transition-all shadow-2xs font-semibold"
                title={
                  language === 'th'
                    ? 'มีรูปภาพแนบมากับข้อความ (ชี้เมาส์เพื่อดูรูป / คลิกเปิดรูปใหญ่)'
                    : 'Attached image (Hover to preview / Click to open)'
                }
              >
                <ImageIcon size={11} className="text-sky-600 dark:text-sky-400" />
                <span>{language === 'th' ? 'ดูรูป' : 'Image'}</span>
              </span>
            )}

            {/* Multi-issue indicator when AI detected >1 sub-issues */}
            {issueCount > 1 && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/70 shrink-0 font-bold"
                title={
                  language === 'th'
                    ? `AI ตรวจพบ ${issueCount} ประเด็นย่อยในบทสนทนานี้`
                    : `${issueCount} sub-issues detected`
                }
              >
                <Layers size={10} />
                <span>
                  {issueCount} {language === 'th' ? 'ประเด็น' : 'issues'}
                </span>
              </span>
            )}

            <span className="text-neutral-800 dark:text-neutral-200 truncate block leading-relaxed font-normal">
              {chat.summary || (
                <span className="text-neutral-400 italic">
                  {language === 'th' ? 'ไม่มีข้อความสรุป' : 'No summary'}
                </span>
              )}
            </span>
          </div>

          {/* Custom Tags Row */}
          {visibleTags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {visibleTags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200/70 dark:border-neutral-700/70"
                >
                  {tag}
                </span>
              ))}
              {visibleTags.length > 3 && (
                <span className="text-[10px] font-mono text-neutral-400">
                  +{visibleTags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </td>

      {/* 4. Inline Quick Category Selector */}
      <td className="px-3 py-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        {onQuickCategoryChange && categories.length > 0 ? (
          <div className="relative inline-flex items-center">
            <select
              value={currentBaseCat}
              disabled={isUpdatingCat}
              onChange={handleCategorySelect}
              className="appearance-none bg-white dark:bg-neutral-800/90 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-200/90 dark:border-neutral-700/90 hover:border-neutral-300 dark:hover:border-neutral-600 rounded-xl pl-3 pr-7 py-1 text-xs font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all max-w-[185px] truncate shadow-2xs"
              title={language === 'th' ? 'คลิกเพื่อสลับหมวดหมู่ได้ทันที' : 'Click to change category immediately'}
            >
              {categories.map((cat) => {
                const baseId = getBaseCatId(cat.id);
                const label =
                  language === 'en'
                    ? cat.name_en || getCategoryLabel(cat, 'en')
                    : cat.name_th || cat.name || getCategoryLabel(cat, 'th');
                return (
                  <option key={baseId} value={baseId}>
                    {label}
                  </option>
                );
              })}
            </select>
            {isUpdatingCat ? (
              <Loader2
                size={11}
                className="pointer-events-none absolute right-2.5 text-blue-500 animate-spin"
              />
            ) : (
              <ChevronDown
                size={11}
                className="pointer-events-none absolute right-2.5 text-neutral-400 dark:text-neutral-500"
              />
            )}
          </div>
        ) : (
          <span className="text-neutral-800 dark:text-neutral-200 text-xs font-semibold">
            {(() => {
              const found = categories.find(
                (c) => c.id === chat.category_id || getBaseCatId(c.id) === currentBaseCat
              );
              return getCategoryLabel(found || chat.category_id, language);
            })()}
          </span>
        )}
      </td>

      {/* 5. One-Click Triage Action & Audit Status */}
      <td className="px-3 py-3.5 whitespace-nowrap text-right">
        <div className="inline-flex items-center justify-end gap-2">
          {auditState === 'confirmed' ? (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60"
              title={language === 'th' ? 'ตรวจสอบแล้ว: ถูกต้องตามที่ AI จัดหมวด' : 'Verified: Matches AI'}
            >
              <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'th' ? 'ยืนยันแล้ว' : 'Verified'}</span>
            </span>
          ) : auditState === 'corrected' ? (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60"
              title={language === 'th' ? 'ตรวจสอบแล้ว: ปรับแก้หมวดหมู่โดยแอดมิน' : 'Reviewed: Category corrected'}
            >
              <Edit3 size={12} className="text-amber-600 dark:text-amber-400" />
              <span>{language === 'th' ? 'แก้หมวดแล้ว' : 'Corrected'}</span>
            </span>
          ) : onQuickApprove ? (
            <button
              type="button"
              disabled={isApproving}
              onClick={handleApproveClick}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title={
                language === 'th'
                  ? 'คลิกเดียวเพื่อยืนยันว่า AI จัดหมวดหมู่ถูกต้อง (ไม่ต้องเปิดหน้าต่างแชต)'
                  : 'One-click approve AI classification'
              }
            >
              {isApproving ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Check size={11} strokeWidth={2.5} />
              )}
              <span>{language === 'th' ? 'ยืนยัน AI' : 'Approve AI'}</span>
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
