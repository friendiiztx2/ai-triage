import React from 'react';
import { ChevronRight, Star, Image as ImageIcon } from 'lucide-react';
import { getCategoryLabel, getBaseCatId } from '@/lib/categories';
import ChatPriorityBadge from './table/ChatPriorityBadge';
import ChatStatusToggleBadge from './table/ChatStatusToggleBadge';

export interface ChatTableRowProps {
  chat: any;
  categories: any[];
  isSelected: boolean;
  onSelectChat: (chat: any) => void;
  onHoverImg: (imgUrl: string | null) => void;
  language?: 'th' | 'en';
}

export default function ChatTableRow({
  chat,
  categories,
  isSelected,
  onSelectChat,
  onHoverImg,
  language = 'th',
}: ChatTableRowProps) {
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

  return (
    <tr
      onClick={() => onSelectChat(chat)}
      className={`hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40 transition-[background-color] duration-150 cursor-pointer group text-xs ${
        isSelected ? 'bg-neutral-100/60 dark:bg-neutral-800/60' : ''
      }`}
    >
      {/* Session ID */}
      <td className="px-3 py-3 whitespace-nowrap">
        <span
          className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-200/60 dark:border-neutral-700/60"
          title={chat.id}
        >
          {chat.id && chat.id.length > 12 ? `${chat.id.slice(0, 6)}...${chat.id.slice(-4)}` : chat.id}
        </span>
      </td>

      {/* Customer */}
      <td className="px-3 py-3 whitespace-nowrap font-medium text-neutral-900 dark:text-neutral-100">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="truncate max-w-[130px]" title={chat.customer_name || chat.customer_id}>
            {chat.customer_name || 'ลูกค้า #' + (chat.customer_id || chat.id?.substring(0, 8))}
          </span>
          {chat.tags && chat.tags.includes('#VIP') && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-medium shrink-0">
              <Star size={9} className="fill-amber-400 text-amber-500" />
              <span>VIP</span>
            </span>
          )}
        </div>
      </td>

      {/* Intent & Summary */}
      <td className="px-3 py-3 max-w-[420px]">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* 1. รูปภาพล้วน (Image Only) */}
          {isImgOnly && firstImg && (
            <span
              onMouseEnter={() => onHoverImg(firstImg)}
              onMouseLeave={() => onHoverImg(null)}
              onClick={(e) => {
                e.stopPropagation();
                window.open(firstImg, '_blank');
              }}
              className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 cursor-zoom-in transition-all shadow-2xs hover:scale-105 active:scale-95"
              title={language === 'th' ? 'รูปภาพล้วน (ชี้เมาส์เพื่อซูมดูรูป / คลิกเปิดรูปใหญ่)' : 'Image only (Hover to preview / Click to open)'}
            >
              <ImageIcon size={10} className="text-purple-600 dark:text-purple-400" />
              <span>{language === 'th' ? 'รูปภาพล้วน' : 'Img only'}</span>
            </span>
          )}
          {/* 2. มีรูปแนบมากับข้อความ (Attached Image with Text) */}
          {firstImg && !isImgOnly && (
            <span
              onMouseEnter={() => onHoverImg(firstImg)}
              onMouseLeave={() => onHoverImg(null)}
              onClick={(e) => {
                e.stopPropagation();
                window.open(firstImg, '_blank');
              }}
              className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100 px-1.5 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 cursor-zoom-in shrink-0 transition-all shadow-2xs hover:scale-105 active:scale-95"
              title={language === 'th' ? 'มีรูปภาพแนบมากับข้อความ (ชี้เมาส์เพื่อซูมดูรูป / คลิกเปิดรูปใหญ่)' : 'Attached image (Hover to preview / Click to open)'}
            >
              <ImageIcon size={10} className="text-neutral-500 dark:text-neutral-400" />
              <span>{language === 'th' ? 'ดูรูป' : 'Image'}</span>
            </span>
          )}
          <span className="text-neutral-600 dark:text-neutral-400 truncate block">
            {chat.summary || (
              <span className="text-neutral-400 italic">
                {language === 'th' ? 'ไม่มีข้อความสรุป' : 'No summary'}
              </span>
            )}
          </span>
        </div>
      </td>

      {/* Category */}
      <td className="px-3 py-3 whitespace-nowrap">
        <span className="text-neutral-800 dark:text-neutral-200 text-xs font-medium">
          {(() => {
            const found = categories.find(
              (c) => c.id === chat.category_id || getBaseCatId(c.id) === getBaseCatId(chat.category_id)
            );
            return getCategoryLabel(found || chat.category_id, language);
          })()}
        </span>
      </td>

      {/* Priority */}
      <td className="px-3 py-3 whitespace-nowrap text-center">
        <ChatPriorityBadge priority={chat.priority} />
      </td>

      {/* Status */}
      <td className="px-3 py-3 whitespace-nowrap text-center">
        <ChatStatusToggleBadge
          status={chat.status}
          language={language}
        />
      </td>

      {/* Timestamp */}
      <td className="px-3 py-3 whitespace-nowrap text-right font-mono text-[11px] text-neutral-400">
        {chat.created_at ? (
          <div>
            <span>
              {new Date(chat.created_at).toLocaleTimeString('th-TH', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        ) : (
          '-'
        )}
      </td>

      {/* Action Chevron */}
      <td className="px-2 py-3 text-right">
        <ChevronRight
          size={14}
          className="text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors"
        />
      </td>
    </tr>
  );
}
