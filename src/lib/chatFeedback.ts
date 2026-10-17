import { supabase } from '@/lib/supabase';

interface SaveFeedbackParams {
  chat: any;
  userProfile: any;
  customerInfo: any;
  chatIssues: any[];
  editIssues: Record<string, { category_id: string; priority: string }>;
  editCategory: string;
  editPriority: string;
}

export async function submitChatFeedback({
  chat,
  userProfile,
  customerInfo,
  chatIssues,
  editIssues,
  editCategory,
  editPriority,
}: SaveFeedbackParams) {
  let history: any[] = [];
  try {
    if (chat.resolution && chat.resolution !== 'Pending' && chat.resolution !== 'Solved') {
      const parsed = JSON.parse(chat.resolution);
      if (Array.isArray(parsed)) history = parsed;
    }
  } catch (e) {}

  const hasDbIssues = chatIssues && chatIssues.length > 0;
  let isCorrect = true;
  if (hasDbIssues) {
    chatIssues.forEach((issue) => {
      const currentEdit = editIssues[issue.id];
      if (currentEdit) {
        if (currentEdit.category_id !== (issue.category_id || '') || currentEdit.priority !== (issue.priority || 'low')) {
          isCorrect = false;
        }
      }
    });
  } else {
    const primaryKey = `${chat.id}-primary`;
    const currentEdit = editIssues[primaryKey];
    if (currentEdit) {
      if (currentEdit.category_id !== (chat.category_id || '') || currentEdit.priority !== (chat.priority || 'low')) {
        isCorrect = false;
      }
    } else if (editCategory !== (chat.category_id || '') || editPriority !== (chat.priority || 'low')) {
      isCorrect = false;
    }
  }

  const issuesToSubmit = hasDbIssues
    ? chatIssues.map((issue) => ({
        id: issue.id,
        category_id: editIssues[issue.id]?.category_id || null,
        priority: editIssues[issue.id]?.priority || 'low',
        summary: issue.summary,
      }))
    : [{
        id: `${chat.id}-primary`,
        category_id: editIssues[`${chat.id}-primary`]?.category_id || editCategory || chat.category_id || null,
        priority: editIssues[`${chat.id}-primary`]?.priority || editPriority || chat.priority || 'low',
        summary: chat.summary || 'ประเด็นหลัก',
      }];

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
    actor: userProfile?.name || 'Admin',
    old_category: chat.category_id || '',
    new_category: finalCategoryId || '',
    old_priority: chat.priority || 'low',
    new_priority: finalPriority || 'low',
  };
  
  const updatedHistory = [newLog, ...history];

  const res = await fetch('/api/chats/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chat.id,
      is_correct: isCorrect,
      liked_by: userProfile?.name || customerInfo?.name || chat.customer_id || 'admin',
      issues: issuesToSubmit,
      category_id: finalCategoryId || null,
      priority: finalPriority || null,
      status: 'completed',
      resolution: JSON.stringify(updatedHistory),
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to submit feedback');
  }

  try {
    await supabase.from('activity_logs').insert([{
      company_id: userProfile?.company_id || null,
      user_id: userProfile?.id || 'admin-01',
      user_name: userProfile?.name || 'Admin',
      action_type: 'UPDATE_CATEGORY',
      details: { chat_id: chat.id, old_category: chat.category_id, new_category: finalCategoryId, old_priority: chat.priority, new_priority: finalPriority },
    }]);
  } catch (e) {
    console.warn('activity_logs insert:', e);
  }

  return { finalCategoryId, finalPriority };
}

interface ApproveAIParams {
  chat: any;
  userProfile: any;
  chatIssues: any[];
}

export async function submitApproveAI({
  chat,
  userProfile,
  chatIssues,
}: ApproveAIParams) {
  let history: any[] = [];
  try {
    if (chat.resolution && chat.resolution !== 'Pending' && chat.resolution !== 'Solved') {
      const parsed = JSON.parse(chat.resolution);
      if (Array.isArray(parsed)) history = parsed;
    }
  } catch (e) {}

  const hasDbIssues = chatIssues && chatIssues.length > 0;
  const issuesToSubmit = hasDbIssues
    ? chatIssues.map((issue) => ({
        id: issue.id,
        category_id: issue.category_id || null,
        priority: issue.priority || 'low',
        summary: issue.summary,
      }))
    : [{
        id: `${chat.id}-primary`,
        category_id: chat.category_id || null,
        priority: chat.priority || 'low',
        summary: chat.summary || 'ประเด็นหลัก',
      }];

  let finalCategoryId = chat.category_id || (issuesToSubmit[0]?.category_id) || '';
  let finalPriority = chat.priority || 'low';
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
    actor: `${userProfile?.name || 'Admin'} (อนุมัติตาม AI)`,
    old_category: chat.category_id || '',
    new_category: finalCategoryId || '',
    old_priority: chat.priority || 'low',
    new_priority: finalPriority || 'low',
  };
  const updatedHistory = [newLog, ...history];

  const res = await fetch('/api/chats/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chat.id,
      is_correct: true,
      liked_by: userProfile?.name || 'Admin',
      issues: issuesToSubmit,
      category_id: finalCategoryId || null,
      priority: finalPriority || null,
      status: 'completed',
      resolution: JSON.stringify(updatedHistory),
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to approve AI triage');
  }

  try {
    await supabase.from('activity_logs').insert([{
      company_id: userProfile?.company_id || null,
      user_id: userProfile?.id || 'admin-01',
      user_name: userProfile?.name || 'Admin',
      action_type: 'APPROVE_AI_TRIAGE',
      details: { chat_id: chat.id, category: finalCategoryId, priority: finalPriority },
    }]);
  } catch (e) {
    console.warn('activity_logs insert:', e);
  }

  return { finalCategoryId, finalPriority };
}
