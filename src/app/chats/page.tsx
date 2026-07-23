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
  onClose, 
  onFocus, 
  onSaved,
  onPositionChange 
}: any) {
  const [x, setX] = useState(initialX);
  const [y, setY] = useState(initialY);
  const [width, setWidth] = useState(450);
  const [height, setHeight] = useState(580);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [selectedChatIssues, setSelectedChatIssues] = useState<any[]>([]);
  const [editIssues, setEditIssues] = useState<Record<string, any>>({});
  
  const [editCategory, setEditCategory] = useState(chat.category_id || '');
  const [editPriority, setEditPriority] = useState(chat.priority || 'low');
  
  const [updating, setUpdating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch issues & customer info
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const issuesRes = await fetch('/api/chats/issues?chat_id=' + chat.id);
        if (issuesRes.ok) {
          const issuesData = await issuesRes.json();
          setSelectedChatIssues(issuesData || []);
          
          const initialEditState: Record<string, any> = {};
          if (issuesData && Array.isArray(issuesData)) {
            issuesData.forEach((issue: any) => {
              initialEditState[issue.id] = {
                category_id: issue.category_id || '',
                priority: issue.priority || 'low'
              };
            });
          }
          setEditIssues(initialEditState);
        }
      } catch (err) {
        console.error('Error fetching chat issues:', err);
      }

      try {
        if (chat.customer_id) {
          const custRes = await fetch('/api/customers?customer_id=' + chat.customer_id);
          if (custRes.ok) {
            const cust = await custRes.json();
            setCustomerInfo(cust);
          }
        }
      } catch (err) {
        console.error('Error fetching customer info:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
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
        finalPriority = issuesToSubmit[0].priority || 'low';
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
      
      const newWidth = Math.max(360, Math.min(850, startWidth + dx));
      const newHeight = Math.max(250, Math.min(750, startHeight + dy));
      
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
    let rawConv = chat.conversation;
    if (typeof rawConv === 'string') {
      try {
        rawConv = JSON.parse(rawConv);
      } catch (e) {}
    }

    if (Array.isArray(rawConv)) {
      return (
        <div className="space-y-4">
          {rawConv.map((msg, index) => {
            const isCustomer = msg.sender?.toLowerCase() === 'customer' || msg.sender?.toLowerCase() === 'user';
            return (
              <div 
                key={index} 
                className={'flex flex-col ' + (isCustomer ? 'items-start' : 'items-end')}
              >
                <span className="text-[10px] text-slate-400 dark:text-slate-550 font-bold mb-1 uppercase tracking-wider">
                  {isCustomer ? (chat.customer_name || 'ลูกค้า') : 'แอดมิน / AI'}
                </span>
                <div 
                  className={'p-3.5 rounded-2xl max-w-[85%] text-xs font-medium leading-relaxed ' + 
                    (isCustomer 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none' 
                      : 'bg-indigo-600 text-white rounded-tr-none shadow-sm'
                    )
                  }
                >
                  {msg.message || msg.text}
                </div>
                {msg.time && (
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 select-none font-medium">
                    {msg.time}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-150 p-4 rounded-xl font-mono text-xs text-slate-700 dark:text-slate-355 whitespace-pre-wrap">
        {typeof rawConv === 'string' ? rawConv : JSON.stringify(rawConv, null, 2)}
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
            {chat.customer_name || 'ลูกค้า #' + (chat.customer_id || chat.id?.substring(0, 8))}
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

      {/* Body scroll section (Unified sequentially - No tabs!) */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/20 dark:bg-slate-900/10">
          {loading ? (
            <div className="flex justify-center py-20">
              <RefreshCw size={24} className="animate-spin text-indigo-600 dark:text-indigo-455" />
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* SECTION 1: Conversation History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-850 dark:text-slate-200 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                    💬 ประวัติการคุย (Conversation History)
                  </h4>
                  <span className="text-[9px] text-slate-400 font-mono font-bold select-none">แชตไอดี: {chat.id}</span>
                </div>
                
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm max-h-[300px] overflow-y-auto">
                  {renderConversation()}
                </div>
              </div>

              {/* SECTION 2: AI Recommendations & Edit Form */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-850 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  ✨ บทวิเคราะห์และคำแนะนำ AI
                </h4>

                {(() => {
                  const hasDbIssues = selectedChatIssues && selectedChatIssues.length > 0;
                  const recData = parseAIRecommendation(chat.ai_recommendation);
                  const hasParsedIssues = recData && recData.issues && recData.issues.length > 0;

                  const issuesToRender = hasDbIssues
                    ? selectedChatIssues.map((issue) => ({
                        title: issue.summary,
                        category: issue.categories?.name || issue.category_id || 'อื่นๆ',
                        department: issue.department,
                        priority: issue.priority,
                        reply: issue.recommended_reply,
                        id: issue.id
                      }))
                    : (hasParsedIssues ? recData.issues : []);

                  return (
                    <div className="space-y-4">
                      {/* Custom Form editable block */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-sm">
                        <h5 className="font-extrabold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wider">จัดการหมวดหมู่และความเร่งด่วน</h5>
                        
                        {selectedChatIssues && selectedChatIssues.length > 0 ? (
                          <div className="space-y-4 divide-y divide-slate-105 dark:divide-slate-800">
                            {selectedChatIssues.map((issue, idx) => {
                              const currentVal = editIssues[issue.id] || { category_id: issue.category_id || '', priority: issue.priority || 'low' };
                              return (
                                <div key={issue.id} className={'space-y-3 ' + (idx > 0 ? 'pt-4' : '')}>
                                  <h6 className="font-bold text-xs text-indigo-650 dark:text-indigo-400">เรื่องที่ {idx + 1}: {issue.summary}</h6>
                                  
                                  <div>
                                    <select
                                      value={currentVal.category_id}
                                      onChange={(e) => setEditIssues(prev => ({
                                        ...prev,
                                        [issue.id]: { ...currentVal, category_id: e.target.value }
                                      }))}
                                      disabled={userProfile?.role === 'agent'}
                                      className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold focus:border-indigo-600 focus:outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 disabled:opacity-60"
                                    >
                                      <option value="">-- ไม่ระบุ (อื่นๆ) --</option>
                                      {categories.map((cat: any) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="grid grid-cols-4 gap-1">
                                    {['low', 'medium', 'high', 'urgent'].map(p => {
                                      const isActive = currentVal.priority.toLowerCase() === p;
                                      let activeStyle = '';
                                      if (p === 'urgent') activeStyle = 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-955/35 dark:text-rose-455';
                                      else if (p === 'high') activeStyle = 'bg-orange-50 text-orange-655 border-orange-200 dark:bg-orange-955/35 dark:text-orange-400';
                                      else if (p === 'medium') activeStyle = 'bg-amber-50 text-amber-655 border-amber-200 dark:bg-amber-955/35 dark:text-amber-400';
                                      else if (p === 'low') activeStyle = 'bg-blue-50 text-blue-650 border-blue-200 dark:bg-blue-955/35 dark:text-blue-400';

                                      return (
                                        <button
                                          key={p}
                                          type="button"
                                          onClick={() => setEditIssues(prev => ({
                                            ...prev,
                                            [issue.id]: { ...currentVal, priority: p }
                                          }))}
                                          disabled={userProfile?.role === 'agent'}
                                          className={'py-1 rounded-md text-[9px] font-bold uppercase border text-center transition cursor-pointer ' + 
                                            (isActive ? activeStyle : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-555 border-slate-200 dark:border-slate-800 hover:bg-slate-50')
                                          }
                                        >
                                          {p}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <select 
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                disabled={userProfile?.role === 'agent'}
                                className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold focus:border-indigo-600 focus:outline-none bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 disabled:opacity-60"
                              >
                                <option value="">-- ไม่ระบุ (อื่นๆ) --</option>
                                {categories.map((cat: any) => (
                                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                              </select>
                            </div>

                            <div className="grid grid-cols-4 gap-1">
                              {['low', 'medium', 'high', 'urgent'].map(p => {
                                const isActive = editPriority.toLowerCase() === p;
                                let activeStyle = '';
                                if (p === 'urgent') activeStyle = 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-955/35 dark:text-rose-455';
                                else if (p === 'high') activeStyle = 'bg-orange-50 text-orange-655 border-orange-200 dark:bg-orange-955/35 dark:text-orange-400';
                                else if (p === 'medium') activeStyle = 'bg-amber-50 text-amber-655 border-amber-200 dark:bg-amber-955/35 dark:text-amber-400';
                                else if (p === 'low') activeStyle = 'bg-blue-50 text-blue-605 border-blue-200 dark:bg-blue-955/35 dark:text-blue-400';

                                return (
                                  <button
                                    key={p}
                                    type="button"
                                    onClick={() => setEditPriority(p)}
                                    disabled={userProfile?.role === 'agent'}
                                    className={'py-1 rounded-md text-[9px] font-bold uppercase border text-center transition cursor-pointer ' + 
                                      (isActive ? activeStyle : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-555 border-slate-200 dark:border-slate-800 hover:bg-slate-50')
                                    }
                                  >
                                    {p}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {userProfile?.role === 'agent' ? (
                          <div className="bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-400 text-[10px] p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-900/30 text-center leading-normal">
                            🔒 สิทธิ์พนักงาน ไม่สามารถแก้ไขผลได้
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={updating}
                            onClick={handleSaveChanges}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-300 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-100 dark:shadow-none transition cursor-pointer"
                          >
                            {updating ? 'กำลังบันทึก...' : 'บันทึกการแก้ไขข้อมูล'}
                          </button>
                        )}
                      </div>

                      {/* General recommendations */}
                      {recData && recData.generalRecommendation && (
                        <div className="space-y-1.5">
                          <span className="font-bold text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1"><BookOpen size={11} /> คำแนะนำทั่วไปจาก AI</span>
                          <div className="bg-slate-50 dark:bg-slate-850/50 border border-slate-150 p-3.5 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                            {recData.generalRecommendation}
                          </div>
                        </div>
                      )}

                      {/* Issues breakdown list with copy text */}
                      {issuesToRender.length > 0 && (
                        <div className="space-y-3">
                          {issuesToRender.map((issue, idx) => {
                            const issueId = 'db-issue-win-' + (issue.id || idx);
                            return (
                              <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-2">
                                  <span className="font-bold text-slate-750 dark:text-slate-200 text-xs truncate">เรื่องที่ {idx + 1}: {issue.title}</span>
                                  <span className="px-2 py-0.5 rounded text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-bold">{issue.category}</span>
                                </div>
                                
                                {issue.reply && (
                                  <div className="space-y-2 flex flex-col">
                                    <div className="bg-slate-50 dark:bg-slate-855/40 rounded-xl p-3 text-xs text-slate-755 dark:text-slate-300 leading-relaxed font-semibold">
                                      {issue.reply}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyText(issue.reply, issueId)}
                                      className="flex items-center gap-1 bg-sky-50 hover:bg-sky-100 dark:bg-sky-955/40 text-sky-700 dark:text-sky-400 px-3 py-1.5 rounded-lg border border-sky-100 text-[10px] font-bold shadow-sm transition active:scale-95 cursor-pointer self-end"
                                    >
                                      {copiedId === issueId ? (
                                        <span className="text-emerald-600 font-extrabold">คัดลอกแล้ว!</span>
                                      ) : (
                                        <>
                                          <Copy size={11} />
                                          <span>คัดลอกร่างคำตอบ</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* SECTION 3: Profile & Timeline */}
              <div className="grid grid-cols-1 gap-4">
                {/* Profile Metadata */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-850 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    👤 ข้อมูลโปรไฟล์ลูกค้า (Customer Profile)
                  </h4>
                  
                  {customerInfo ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      <div className="flex items-center justify-between py-2.5">
                        <span className="text-slate-400 font-bold">ชื่อลูกค้า</span>
                        <span className="text-slate-800 dark:text-slate-200 font-medium">{customerInfo.name}</span>
                      </div>
                      {customerInfo.email && (
                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-slate-400 font-bold">อีเมล</span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium">{customerInfo.email}</span>
                        </div>
                      )}
                      {customerInfo.phone && (
                        <div className="flex items-center justify-between py-2.5">
                          <span className="text-slate-400 font-bold">เบอร์โทร</span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium">{customerInfo.phone}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-400 italic text-xs py-2 text-center">ไม่มีโปรไฟล์ลูกค้าลงทะเบียน</div>
                  )}
                </div>

                {/* Audit Logs history */}
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
                                หมวดหมู่: <span className="line-through">{oldCatName}</span> ➔ <span className="font-bold text-indigo-600">{newCatName}</span>
                              </div>
                            </div>
                          );
                        })}
                        
                        <div className="relative text-xs">
                          <div className="absolute -left-[20.5px] top-1 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 ring-2 ring-slate-100" />
                          <div className="text-[9px] text-slate-400 font-bold">{chat.created_at ? new Date(chat.created_at).toLocaleString('th-TH') : '-'}</div>
                          <div className="text-slate-500 font-bold mt-0.5">โดย: ระบบ AI (Gemini Triage)</div>
                          <div className="text-[10px] text-slate-550 mt-0.5">หมวดหมู่เริ่มต้น: {categories.find((c: any) => c.id === chat.category_id)?.name || 'อื่นๆ'}</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

            </div>
          )}
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
  const [dateFilter, setDateFilter] = useState('all');
  const [auditFilter, setAuditFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Search input ref for keyboard shortcut focus
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Calculate Filter Badge Counts
  const pendingCount = chats.filter(c => (c.status || 'pending') === 'pending').length;
  const completedCount = chats.filter(c => c.status === 'completed').length;

  const urgentCount = chats.filter(c => (c.priority || '').toLowerCase() === 'urgent').length;
  const highCount = chats.filter(c => (c.priority || '').toLowerCase() === 'high').length;
  const mediumCount = chats.filter(c => (c.priority || '').toLowerCase() === 'medium').length;
  const lowCount = chats.filter(c => (c.priority || '').toLowerCase() === 'low').length;

  const isAnyFilterActive = searchQuery !== '' || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || dateFilter !== 'all' || auditFilter !== 'all';

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setDateFilter('all');
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

  // Export CSV Handler
  const handleExportCSV = () => {
    if (filteredChats.length === 0) return;
    const headers = ['Chat ID', 'Customer Name', 'Priority', 'Status', 'Summary', 'Created At'];
    const rows = filteredChats.map(c => [
      `"${c.id || ''}"`,
      `"${c.customer_name || ''}"`,
      `"${c.priority || ''}"`,
      `"${c.status || 'pending'}"`,
      `"${(c.summary || '').replace(/"/g, '""')}"`,
      `"${c.created_at || ''}"`
    ]);
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chats-export-${new Date().toISOString().substring(0, 10)}.csv`;
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

  useEffect(() => {
    fetchInitialData();
    const savedSession = localStorage.getItem('user_session');
    if (savedSession) {
      try {
        setUserProfile(JSON.parse(savedSession));
      } catch (e) {}
    }
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const catRes = await fetch('/api/categories');
      if (!catRes.ok) throw new Error('Failed to load categories');
      const catData = await catRes.json();
      setCategories(catData);

      const chatsRes = await fetch('/api/chats');
      if (!chatsRes.ok) throw new Error('Failed to load chats');
      const chatsData = await chatsRes.json();
      
      if (chatsData) {
        const sorted = [...chatsData].sort((a, b) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
        setChats(sorted);
        setFilteredChats(sorted);
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

        if (statusParam) setStatusFilter(statusParam);
        if (priorityParam) setPriorityFilter(priorityParam);
        if (categoryParam) setCategoryFilter(categoryParam);
        if (auditParam) setAuditFilter(auditParam);
      }
    }
  }, [chats]);

  // Apply filters
  useEffect(() => {
    let result = chats;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.customer_name?.toLowerCase().includes(q) || 
        c.summary?.toLowerCase().includes(q) ||
        c.id?.toLowerCase().includes(q)
      );
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
        return pri === priorityFilter;
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

    if (dateFilter !== 'all') {
      const now = new Date();
      const cutoff = new Date();

      if (dateFilter === 'today') {
        cutoff.setHours(0, 0, 0, 0);
        result = result.filter(c => c.created_at && new Date(c.created_at) >= cutoff);
      } else if (dateFilter === '7days') {
        cutoff.setDate(now.getDate() - 7);
        result = result.filter(c => c.created_at && new Date(c.created_at) >= cutoff);
      } else if (dateFilter === '30days') {
        cutoff.setDate(now.getDate() - 30);
        result = result.filter(c => c.created_at && new Date(c.created_at) >= cutoff);
      } else if (dateFilter === 'custom' && startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        result = result.filter(c => {
          if (!c.created_at) return false;
          const chatDate = new Date(c.created_at);
          return chatDate >= start && chatDate <= end;
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

    // Stagger initial window position
    const offset = (activeWindows.length % 6) * 35;
    const initialX = 180 + offset;
    const initialY = 120 + offset;

    const newWin = {
      id: chat.id,
      chat,
      x: initialX,
      y: initialY,
      zIndex: newZ
    };

    setActiveWindows(prev => [...prev, newWin]);
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
              className={`flex items-center gap-2 border px-3.5 py-2.5 rounded-l-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                soundEnabled
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-650 dark:bg-indigo-955/20 dark:border-indigo-900/50 dark:text-indigo-400'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-855'
              }`}
              title={soundEnabled ? 'ปิดเสียงแจ้งเตือนเคสด่วนที่สุด' : 'เปิดเสียงแจ้งเตือนเคสด่วนที่สุด'}
            >
              {soundEnabled ? '🔔 เสียงเคสด่วน: เปิด' : '🔕 เสียงเคสด่วน: ปิด'}
            </button>
            <button
              onClick={() => setShowSoundModal(true)}
              className={`border-y border-r px-2.5 py-2.5 rounded-r-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                soundEnabled
                  ? 'bg-indigo-100/70 border-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-900/50 dark:text-indigo-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-50'
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
                <option key={cat.id} value={cat.id}>{cat.name}</option>
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

          {/* Date Filter Column */}
          <div className="w-full flex flex-col gap-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl px-4 py-2.5 text-sm font-semibold focus:border-indigo-600 focus:outline-none transition text-slate-855 dark:text-slate-100"
            >
              <option value="all">{t('filterTimeframe')}</option>
              <option value="today">{language === 'th' ? 'ช่วงเวลา: วันนี้' : 'Timeframe: Today'}</option>
              <option value="7days">{language === 'th' ? 'ช่วงเวลา: 7 วันล่าสุด' : 'Timeframe: Last 7 Days'}</option>
              <option value="30days">{language === 'th' ? 'ช่วงเวลา: 30 วันล่าสุด' : 'Timeframe: Last 30 Days'}</option>
              <option value="custom">{language === 'th' ? 'ระบุช่วงวันที่เอง...' : 'Custom Range...'}</option>
            </select>
            
            {dateFilter === 'custom' && (
              <div className="flex flex-col gap-1.5 text-xs text-slate-400 dark:text-slate-555 bg-slate-50 dark:bg-slate-855/50 p-2.5 rounded-xl border border-slate-150 dark:border-slate-800">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold">{language === 'th' ? 'จาก:' : 'From:'}</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs font-semibold focus:border-indigo-600 focus:outline-none transition text-slate-800 dark:text-slate-100 w-[130px]"
                  />
                </div>
                <div className="flex items-center justify-between gap-1">
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

        {/* 1-Click Clear Filters Bar */}
          {isAnyFilterActive && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {language === 'th' ? `พบรายการคัดกรอง ${filteredChats.length} รายการ` : `Found ${filteredChats.length} filtered results`}
              </span>
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold bg-rose-50 dark:bg-rose-955/30 px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-900/40 transition cursor-pointer"
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
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
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
                    <th className="px-6 py-4 w-12 text-center select-none">
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
                    <th className="px-6 py-4">{t('colChatId')}</th>
                    <th className="px-6 py-4">{t('colCustomer')}</th>
                    <th className="px-6 py-4">{t('colAiSummary')}</th>
                    <th className="px-6 py-4">{t('colCategory')}</th>
                    <th className="px-6 py-4">{t('colPriority')}</th>
                    <th className="px-6 py-4">{t('colStatus')}</th>
                    <th className="px-6 py-4">{t('colTime')}</th>
                    <th className="px-6 py-4"></th>
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
                        <td className="px-6 py-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={(e) => handleToggleSelect(chat.id, e as any)}
                            className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-slate-700 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>

                        {/* Chat ID */}
                        <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {chat.id}
                        </td>

                        {/* Customer */}
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                          {chat.customer_name || ('ลูกค้า #' + (chat.customer_id || chat.id?.substring(0, 8)))}
                        </td>
                        
                        {/* Summary with AI Confidence Badge */}
                        <td className="px-6 py-4 max-w-xs text-slate-600 dark:text-slate-300 font-medium">
                          <div className="flex flex-col gap-1.5">
                            <span className="truncate block">{chat.summary || <span className="text-slate-400 dark:text-slate-555 italic">{language === 'th' ? 'ไม่มีข้อมูลสรุป' : 'No summary'}</span>}</span>
                            {chat.confidence !== undefined && chat.confidence !== null && (
                              <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold w-max px-2 py-0.5 rounded-full border leading-none select-none ${
                                chat.confidence >= 85 
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' 
                                  : chat.confidence >= 70 
                                    ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/30' 
                                    : 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-955/20 dark:text-rose-455 dark:border-rose-900/30'
                              }`}>
                                <Sparkles size={8} className="shrink-0" /> AI มั่นใจ {chat.confidence}%
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Category */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-2.5 py-1 rounded-lg">
                              {categories.find(c => c.id === chat.category_id)?.name || chat.category_id || 'อื่นๆ'}
                            </span>
                            {chat.chat_issues && chat.chat_issues.length > 1 && (
                              <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border border-indigo-100/60 dark:border-indigo-900/40 shrink-0">
                                +{chat.chat_issues.length - 1} เรื่อง
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="px-6 py-4">
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

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span className={'text-xs font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap ' + 
                            (chat.status === 'completed' 
                              ? 'bg-emerald-50 dark:bg-emerald-955/30 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-amber-50 dark:bg-amber-955/30 text-amber-600 dark:text-amber-400'
                            )
                          }>
                            {chat.status === 'completed' ? (language === 'th' ? 'แยกแยะแล้ว' : 'Completed') : (language === 'th' ? 'รอดำเนินการ' : 'Pending')}
                          </span>
                        </td>

                        {/* Time */}
                        <td className="px-6 py-4 text-xs text-slate-400 dark:text-slate-555 font-medium">
                          {chat.created_at ? new Date(chat.created_at).toLocaleString('th-TH') : '-'}
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4 text-right">
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
        />
      ))}
    </div>
  );
}
