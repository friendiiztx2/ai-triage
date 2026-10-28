'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getBaseCatId } from '@/lib/categories';
import { submitChatFeedback, submitApproveAI } from '@/lib/chatFeedback';

interface UseChatTriageOptions {
  chat: any;
  userProfile: any;
  onSaved: () => void;
  language: 'th' | 'en';
}

export function useChatTriage({ chat, userProfile, onSaved, language }: UseChatTriageOptions) {
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [chatIssues, setChatIssues] = useState<any[]>([]);
  const [loadingIssues, setLoadingIssues] = useState<boolean>(true);
  const [retryingTriage, setRetryingTriage] = useState<boolean>(false);
  const [triageError, setTriageError] = useState<string | null>(null);
  const [triageSuccess, setTriageSuccess] = useState<string | null>(null);
  const [editIssues, setEditIssues] = useState<Record<string, { category_id: string; priority: string }>>({});

  const [editCategory, setEditCategory] = useState(chat?.category_id || '');
  const [editPriority, setEditPriority] = useState(chat?.priority || 'low');
  const [updating, setUpdating] = useState(false);

  // Fetch directly from Supabase table 'chat_issues'
  const loadChatIssues = useCallback(async () => {
    if (!chat?.id) return;
    setLoadingIssues(true);
    setTriageError(null);
    try {
      let issuesList: any[] | null = null;
      try {
        const apiRes = await fetch(`/api/chats/issues?chat_id=${encodeURIComponent(chat.id)}`);
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (Array.isArray(apiData) && apiData.length > 0) {
            issuesList = apiData;
          }
        }
      } catch (e) {}

      if (issuesList && Array.isArray(issuesList) && issuesList.length > 0) {
        setChatIssues(issuesList);
        const initialMap: Record<string, any> = {};
        issuesList.forEach((issue: any) => {
          const issueKey = issue.id || 'issue-0';
          initialMap[issueKey] = {
            category_id: getBaseCatId(issue.category_id || ''),
            priority: (issue.priority || 'medium').toLowerCase(),
          };
        });
        setEditIssues(initialMap);
      } else {
        setChatIssues([]);
        if (chat.status === 'completed') {
          const primaryKey = `${chat.id}-primary`;
          setEditIssues({
            [primaryKey]: {
              category_id: getBaseCatId(chat.category_id || ''),
              priority: (chat.priority || 'medium').toLowerCase(),
            },
          });
        }
      }
    } catch (err: any) {
      console.error('Error fetching chat_issues from Supabase:', err);
      setChatIssues([]);
    } finally {
      setLoadingIssues(false);
    }
  }, [chat?.id, chat?.category_id, chat?.priority, chat?.status]);

  // Trigger AI Triage re-analysis
  const handleTriggerTriage = async () => {
    setRetryingTriage(true);
    setTriageError(null);
    setTriageSuccess(null);
    try {
      const triageBackendUrl = process.env.NEXT_PUBLIC_TRIAGE_BACKEND_URL;
      const targetEndpoint = triageBackendUrl
        ? `${triageBackendUrl}/api/chats/${chat.id}/triage`
        : `/api/chats/${chat.id}/triage`;

      const res = await fetch(targetEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      setTriageSuccess(language === 'th' ? 'วิเคราะห์ด้วย Sift AI ซ้ำสำเร็จ' : 'Sift AI completed');
      setTimeout(() => setTriageSuccess(null), 3500);

      await loadChatIssues();
      if (onSaved) onSaved();
    } catch (err: any) {
      console.error('Failed to trigger Sift AI:', err);
      setTriageError(
        err.message || 'ไม่สามารถเรียก Sift AI ได้ กรุณาตรวจสอบว่า Service ที่พอร์ต 4000 เปิดทำงานอยู่'
      );
    } finally {
      setRetryingTriage(false);
    }
  };

  // Fetch issues & customer info, reset local edit state on chat change
  useEffect(() => {
    let isMounted = true;
    setEditCategory(chat?.category_id || '');
    setEditPriority(chat?.priority || 'low');
    setTriageError(null);
    setTriageSuccess(null);

    async function loadData() {
      await loadChatIssues();
      if (chat?.customer_id) {
        try {
          const custRes = await fetch('/api/customers?customer_id=' + chat.customer_id);
          if (custRes.ok && isMounted) {
            const cust = await custRes.json();
            if (cust) setCustomerInfo(cust);
          }
        } catch (e) {}
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [chat?.id, loadChatIssues]);

  // Polling check if status is pending
  useEffect(() => {
    if (chat?.status === 'pending') {
      const timer = setInterval(() => {
        loadChatIssues();
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [chat?.id, chat?.status, loadChatIssues]);

  const handleSaveChanges = async () => {
    setUpdating(true);
    try {
      await submitChatFeedback({
        chat,
        userProfile,
        customerInfo,
        chatIssues,
        editIssues,
        editCategory,
        editPriority,
      });
      onSaved();
      setTriageSuccess(language === 'th' ? '✓ บันทึกการแก้ไขสำเร็จ' : '✓ Saved changes successfully');
      setTimeout(() => setTriageSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving chat feedback:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleApproveAI = async () => {
    setUpdating(true);
    try {
      await submitApproveAI({
        chat,
        userProfile,
        chatIssues,
      });
      onSaved();
      setTriageSuccess(language === 'th' ? '✓ อนุมัติตาม AI สำเร็จ!' : '✓ AI Approved successfully!');
      setTimeout(() => setTriageSuccess(null), 3000);
    } catch (err) {
      console.error('Error approving AI triage:', err);
    } finally {
      setUpdating(false);
    }
  };

  return {
    customerInfo,
    chatIssues,
    loadingIssues,
    retryingTriage,
    triageError,
    triageSuccess,
    editIssues,
    setEditIssues,
    editCategory,
    setEditCategory,
    editPriority,
    setEditPriority,
    updating,
    loadChatIssues,
    handleTriggerTriage,
    handleSaveChanges,
    handleApproveAI,
  };
}
