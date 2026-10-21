'use client';

import React, { useState } from 'react';
import { Loader2, RotateCcw, Check, CheckCircle2, AlertTriangle } from 'lucide-react';
import ChatIssueItemCard from './ChatIssueItemCard';
import ChatReportModal from './ChatReportModal';

interface ChatIssuesTriagePanelProps {
  chat: any;
  chatIssues: any[];
  categories: any[];
  userProfile: any;
  language: string;
  editIssues: Record<string, { category_id: string; priority: string }>;
  setEditIssues: React.Dispatch<React.SetStateAction<Record<string, { category_id: string; priority: string }>>>;
  setEditCategory: (cat: string) => void;
  setEditPriority: (prio: string) => void;
  retryingTriage: boolean;
  loadingIssues: boolean;
  triageError: string | null;
  triageSuccess: string | null;
  onTriggerTriage: () => void;
  onReloadIssues: () => void;
  onApproveAI: () => void;
  onSaveChanges: () => void;
  updating: boolean;
  copiedId: any;
  onCopyText: (text: string, id: string) => void;
}

export default function ChatIssuesTriagePanel({
  chat,
  chatIssues,
  categories,
  userProfile,
  language,
  editIssues,
  setEditIssues,
  setEditCategory,
  setEditPriority,
  retryingTriage,
  loadingIssues,
  triageError,
  triageSuccess,
  onTriggerTriage,
  onReloadIssues,
  onApproveAI,
  onSaveChanges,
  updating,
  copiedId,
  onCopyText,
}: ChatIssuesTriagePanelProps) {
  const [showReportModal, setShowReportModal] = useState(false);
  const hasIssues = (chatIssues && chatIssues.length > 0) || !!chat.category_id || !!chat.summary;
  const isWaitingForAI = retryingTriage || (loadingIssues && !hasIssues);

  if (isWaitingForAI) {
    return (
      <div className="bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-3.5 shadow-2xs">
        <Loader2 size={28} className="animate-spin text-neutral-400" />
        <div className="space-y-1">
          <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            กำลังวิเคราะห์ข้อมูลด้วย Sift AI...
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            {language === 'th'
              ? 'ระบบกำลังประมวลผลแยกแยะและจัดหมวดหมู่ประเด็นปัญหา'
              : 'Sift AI is analyzing and classifying issues'}
          </p>
        </div>

        {triageError && (
          <div className="w-full max-w-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-2.5 rounded-lg text-xs text-rose-700 dark:text-rose-300 text-left">
            {triageError}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onTriggerTriage}
            disabled={retryingTriage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-medium shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <RotateCcw size={12} className={retryingTriage ? 'animate-spin' : ''} />
            <span>{retryingTriage ? 'กำลังส่งคำขอ...' : 'สั่งวิเคราะห์ซ้ำ'}</span>
          </button>
          <button
            type="button"
            onClick={onReloadIssues}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-xs font-medium transition cursor-pointer"
          >
            <span>ตรวจสอบผลลัพธ์</span>
          </button>
        </div>
      </div>
    );
  }

  const issuesToDisplay =
    chatIssues && chatIssues.length > 0
      ? chatIssues
      : [
          {
            id: `${chat.id}-primary`,
            summary: chat.summary || 'ประเด็นหลักจากบทสนทนา',
            category_id: chat.category_id || '',
            priority: chat.priority || 'medium',
            department: chat.department || null,
            recommended_reply: chat.recommended_reply || null,
          },
        ];

  const isSingleFallback = chatIssues.length === 0;

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
          {isSingleFallback
            ? language === 'th'
              ? 'ประเด็นหลัก (1 เรื่อง)'
              : 'Primary Issue (1)'
            : `${language === 'th' ? 'ประเด็นย่อย' : 'Sub-issues'} (${issuesToDisplay.length})`}
        </span>
        <span className="text-[10px] font-mono text-neutral-400">
          Sift AI Engine
        </span>
      </div>

      <div className="space-y-2.5">
        {issuesToDisplay.map((issueItem: any, idx: number) => {
          const issueKey = issueItem.id || 'issue-' + idx;
          const currentVal = editIssues[issueKey] || {
            category_id: issueItem.category_id || '',
            priority: issueItem.priority || 'medium',
          };

          return (
            <ChatIssueItemCard
              key={idx}
              idx={idx}
              issueItem={issueItem}
              categories={categories}
              userProfile={userProfile}
              language={language}
              currentVal={currentVal}
              onUpdateCategory={(newCat) => {
                setEditIssues((prev) => ({
                  ...prev,
                  [issueKey]: { ...currentVal, category_id: newCat },
                }));
                if (idx === 0) setEditCategory(newCat);
              }}
              onUpdatePriority={(newPri) => {
                setEditIssues((prev) => ({
                  ...prev,
                  [issueKey]: { ...currentVal, priority: newPri },
                }));
                if (idx === 0) setEditPriority(newPri);
              }}
              copiedId={copiedId}
              onCopyText={onCopyText}
            />
          );
        })}
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTriggerTriage}
            disabled={retryingTriage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-200/80 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 text-xs font-medium transition cursor-pointer disabled:opacity-50"
            title="ให้ AI ทำการ Triage ใหม่ตามกฎเกณฑ์หมวดหมู่ล่าสุด"
          >
            <RotateCcw size={12} className={retryingTriage ? 'animate-spin text-neutral-600 dark:text-neutral-300' : 'text-neutral-500'} />
            <span>{retryingTriage ? 'กำลังประมวลผล...' : 'Sift AI วิเคราะห์ใหม่'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-300/80 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-xs font-medium transition cursor-pointer"
            title="รายงานผลการวิเคราะห์ AI ไม่ถูกต้องถึงผู้พัฒนา"
          >
            <AlertTriangle size={12} className="text-amber-600 dark:text-amber-400" />
            <span>{language === 'th' ? 'รายงาน AI' : 'Report AI'}</span>
          </button>

          {triageSuccess && (
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 animate-fade-in">
              <Check size={12} /> {triageSuccess}
            </span>
          )}
        </div>

        {userProfile?.role !== 'agent' && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onSaveChanges}
              disabled={updating}
              className="px-3.5 py-1.5 rounded-lg bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-medium shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {updating ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </button>
          </div>
        )}
      </div>

      {/* Report AI Modal */}
      <ChatReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        chat={chat}
        categories={categories}
        userProfile={userProfile}
        language={language}
        chatIssues={chatIssues}
      />
    </>
  );
}
