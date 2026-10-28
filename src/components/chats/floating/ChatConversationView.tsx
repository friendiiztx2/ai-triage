'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, ZoomIn, FileText, Copy, Check } from 'lucide-react';

interface ChatConversationViewProps {
  chat: any;
  chatIssues: any[];
  language: string;
  onHoverImg: (url: string | null) => void;
}

export default function ChatConversationView({
  chat,
  chatIssues,
  language,
  onHoverImg,
}: ChatConversationViewProps) {
  const [copiedChatId, setCopiedChatId] = useState(false);

  const handleCopyChatId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!chat?.id) return;
    navigator.clipboard.writeText(chat.id);
    setCopiedChatId(true);
    setTimeout(() => setCopiedChatId(false), 1800);
  };

  let rawText = chat.conversation;
  const isJustSummary =
    !rawText || (chat.summary && rawText.trim() === String(chat.summary).trim());

  if (isJustSummary && chatIssues && chatIssues.length > 0) {
    rawText = chatIssues
      .map((i: any) => i.issue_summary || i.summary)
      .filter(Boolean)
      .join(' ');
    if (rawText && !rawText.startsWith('ลูกค้า:')) {
      rawText = `ลูกค้า: ${rawText}`;
    }
  } else if (isJustSummary && chat.chat_issues && chat.chat_issues.length > 0) {
    rawText = chat.chat_issues
      .map((i: any) => i.issue_summary || i.summary)
      .filter(Boolean)
      .join(' ');
    if (rawText && !rawText.startsWith('ลูกค้า:')) {
      rawText = `ลูกค้า: ${rawText}`;
    }
  } else if (!rawText && chat.summary) {
    rawText = `ลูกค้า: ${chat.summary}`;
  }

  // Extract Image URLs
  const foundImages: string[] = [];
  if (chat.media_urls && Array.isArray(chat.media_urls)) {
    foundImages.push(...chat.media_urls);
  }

  const genericUrlRegex = /(https?:\/\/[^\s\n"']+)/gi;
  const urlMatches = (rawText || '').match(genericUrlRegex) || [];
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
  let cleanedText = rawText || '';
  foundImages.forEach((imgUrl) => {
    cleanedText = cleanedText.replace(imgUrl, '').trim();
  });
  cleanedText = cleanedText.replace(/\(📷[^\)]*\)/g, '').replace(/📷[^\n]*/g, '').trim();

  const isImageOnlyChat = foundImages.length > 0 && !cleanedText;

  return (
    <div className="p-4 space-y-3.5 flex-1 overflow-y-auto">
      {/* Section Header: Conversation History & Full Chat ID (แชตไอดี) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800/80">
        <h4 className="font-bold text-neutral-800 dark:text-neutral-200 text-xs flex items-center gap-1.5 uppercase tracking-wider">
          <span>💬 {language === 'th' ? 'ประวัติการคุย (CONVERSATION HISTORY)' : 'CONVERSATION HISTORY'}</span>
        </h4>
        <button
          type="button"
          onClick={handleCopyChatId}
          className="inline-flex items-center gap-1.5 text-[10px] text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 font-mono font-semibold bg-neutral-100 hover:bg-neutral-200/70 dark:bg-neutral-800 dark:hover:bg-neutral-700 px-2 py-0.5 rounded-md border border-neutral-200/70 dark:border-neutral-700/70 transition-colors cursor-pointer select-text"
          title={language === 'th' ? 'คลิกเพื่อคัดลอกแชตไอดี' : 'Click to copy Chat ID'}
        >
          <span>{language === 'th' ? 'แชตไอดี:' : 'Chat ID:'} {chat.id}</span>
          {copiedChatId ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} className="opacity-70" />}
        </button>
      </div>

      {!rawText ? (
        <div className="text-neutral-400 dark:text-neutral-500 text-xs p-8 text-center flex flex-col items-center justify-center space-y-2">
          <FileText size={20} className="text-neutral-300 dark:text-neutral-600" />
          <span>ไม่มีประวัติบทสนทนา</span>
        </div>
      ) : isImageOnlyChat ? (
        <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center shrink-0">
              <ImageIcon size={16} />
            </div>
            <div>
              <div className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs flex items-center gap-2">
                <span>{language === 'th' ? 'ลูกค้าส่งรูปภาพแนบมาในบทสนทนา' : 'Image-Only Message'}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  {language === 'th' ? 'ไม่มีข้อความ' : 'No text'}
                </span>
              </div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                {language === 'th' 
                  ? 'ระบบ Sift AI วิเคราะห์และสกัดข้อมูลจากรูปภาพที่แนบมาโดยอัตโนมัติ' 
                  : 'Sift AI analyzed and extracted details from the attached image'}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-[#e8f0fe] text-[#1a73e8] dark:bg-blue-950/60 dark:text-blue-300 border border-[#1a73e8]/20 shrink-0 uppercase tracking-wider font-semibold">
            {language === 'th' ? 'รูปภาพ' : 'Image'}
          </span>
        </div>
      ) : (
        /* Normal Chat Text Bubble */
        <div className="bg-neutral-50 dark:bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed whitespace-pre-line select-text min-h-[90px] max-h-[340px] overflow-y-auto">
          {cleanedText || <span className="text-neutral-400 italic">ลูกค้าส่งรูปภาพแนบมาในบทสนทนา</span>}
        </div>
      )}

      {/* Embedded Real Image Preview Cards */}
      {foundImages.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-200/80 dark:border-neutral-800 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <ImageIcon size={13} className="text-neutral-400" />
              <span>ภาพแนบจากลูกค้า ({foundImages.length})</span>
            </span>
            <span className="text-[10px] font-mono text-neutral-400">ชี้เมาส์เพื่อซูม</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {foundImages.map((imgUrl, iidx) => (
              <div
                key={iidx}
                onMouseEnter={() => onHoverImg(imgUrl)}
                onMouseLeave={() => onHoverImg(null)}
                onClick={() => window.open(imgUrl, '_blank')}
                className="group relative block rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 hover:shadow-md transition aspect-video cursor-zoom-in"
                title="ชี้เมาส์เพื่อขยาย หรือคลิกเพื่อเปิดในแท็บใหม่"
              >
                <img 
                  src={imgUrl} 
                  alt={`Attachment ${iidx + 1}`} 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  onError={(e: any) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-neutral-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-end justify-between p-2 text-white">
                  <span className="text-[10px] font-mono flex items-center gap-1">
                    <ZoomIn size={12} />
                    <span>ขยายภาพ</span>
                  </span>
                  <span className="text-[9px] bg-black/50 backdrop-blur-xs px-1.5 py-0.5 rounded font-mono">
                    #{iidx + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
