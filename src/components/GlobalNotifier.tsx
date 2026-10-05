'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, X, ArrowRight, Volume2 } from 'lucide-react';
import { playAlertTone, getAudioContext } from '@/lib/audio';
import { supabase } from '@/lib/supabase';

interface UrgentToast {
  id: string;
  customerName: string;
  summary: string;
  priority: string;
  companyId?: string;
}

export default function GlobalNotifier() {
  const [toast, setToast] = useState<UrgentToast | null>(null);
  const [popupEnabled, setPopupEnabled] = useState(true);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPaused, setIsPaused] = useState(false);

  // Sync popup enabled state with localStorage
  useEffect(() => {
    const checkPopupSetting = () => {
      if (typeof window === 'undefined') return;
      const saved = localStorage.getItem('desktop_popup_enabled');
      const isEnabled = saved !== 'false'; // Default to true if not set
      setPopupEnabled(isEnabled);
      if (!isEnabled) {
        setToast(null);
      }
    };

    checkPopupSetting();
    window.addEventListener('desktop-popup-setting-changed', checkPopupSetting);
    window.addEventListener('storage', checkPopupSetting);
    return () => {
      window.removeEventListener('desktop-popup-setting-changed', checkPopupSetting);
      window.removeEventListener('storage', checkPopupSetting);
    };
  }, []);

  const triggerSound = () => {
    if (typeof window === 'undefined') return;
    const soundOn = localStorage.getItem('chats_sound_enabled') === 'true';
    if (!soundOn) return;
    try {
      playAlertTone();
    } catch (e) {}
  };

  const getNotifiedIds = (): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = sessionStorage.getItem('notified_urgent_ids');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  };

  const markAsNotified = (id: string) => {
    if (typeof window === 'undefined') return;
    try {
      const current = getNotifiedIds();
      current.add(id);
      sessionStorage.setItem('notified_urgent_ids', JSON.stringify(Array.from(current)));
    } catch {}
  };

  const getActiveCompanyId = () => {
    if (typeof window === 'undefined') return null;
    const matchCookie = document.cookie.match(/(?:^|; )company_id=([^;]*)/);
    return matchCookie ? decodeURIComponent(matchCookie[1]) : (localStorage.getItem('company_id') || '2c3f46cc-fae8-4ef8-99e1-874dec8b2af2');
  };

  useEffect(() => {
    const checkSession = () => {
      if (typeof window === 'undefined') return false;
      const session = localStorage.getItem('user_session');
      return !!session;
    };

    const pollUrgentChats = async () => {
      if (!checkSession()) return;
      
      // If user disabled popups, do not fetch or display toasts
      const isPopupOn = typeof window !== 'undefined' ? localStorage.getItem('desktop_popup_enabled') !== 'false' : true;
      if (!isPopupOn) return;

      try {
        const compId = getActiveCompanyId();
        const url = compId && compId !== 'all'
          ? `/api/chats?summary_only=true&company_id=${compId}&nocache=${Date.now()}`
          : `/api/chats?summary_only=true&nocache=${Date.now()}`;

        const res = await fetch(url, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        if (!res.ok) return;

        const chats = await res.json();
        if (!Array.isArray(chats)) return;

        const notifiedSet = getNotifiedIds();
        const now = Date.now();
        // Only alert cases created within the last 2 hours (avoid popping up old historical cases)
        const recentThreshold = now - (2 * 60 * 60 * 1000);

        // Find urgent chats belonging to the active company that haven't been resolved
        const urgentChats = chats.filter(c => {
          const pri = (c.priority || '').toLowerCase();
          const urg = (c.urgency || '').toLowerCase();
          const isUrgent = pri === 'urgent' || pri === 'critical' || urg === 'urgent';
          if (!isUrgent) return false;

          // Ignore already resolved chats
          const res = (c.resolution || '').toLowerCase();
          if (res === 'solved' || res === 'closed') return false;
          const status = (c.status || '').toLowerCase();
          if (status === 'resolved' || status === 'closed') return false;

          const createdTime = new Date(c.created_at || 0).getTime();
          // Must be recent (within 2 hours)
          if (createdTime > 0 && createdTime < recentThreshold) return false;

          return true;
        });

        if (urgentChats.length === 0) return;

        // Find genuinely un-notified urgent cases (not yet shown or dismissed)
        const newUrgent = urgentChats.filter(c => !notifiedSet.has(c.id));
        if (newUrgent.length > 0) {
          const sorted = [...newUrgent].sort((a, b) => 
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );
          const newest = sorted[0];

          markAsNotified(newest.id);

          setToast({
            id: newest.id,
            customerName: newest.customer_name || `ลูกค้า #${newest.customer_id || newest.id}`,
            summary: newest.summary || 'พบเคสด่วนต้องการความช่วยเหลือเร่งด่วน',
            priority: newest.priority || 'urgent',
            companyId: newest.company_id
          });
          setTimeLeft(60);
          setIsPaused(false);

          triggerSound();
        }
      } catch (err) {
        console.error('Polling urgent chats failed:', err);
      }
    };

    pollUrgentChats();
    // Shorter fallback poll interval (8s)
    const intervalId = setInterval(pollUrgentChats, 8000);

    // 🔔 Realtime listener for instant notification without refreshing
    const channel = supabase
      .channel('global-urgent-notifier-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, (payload: any) => {
        if (payload?.eventType === 'INSERT' || payload?.eventType === 'UPDATE') {
          const row = payload.new;
          if (row) {
            const pri = (row.priority || '').toLowerCase();
            const urg = (row.urgency || '').toLowerCase();
            const isUrgent = pri === 'urgent' || pri === 'critical' || urg === 'urgent';
            const res = (row.resolution || '').toLowerCase();
            const status = (row.status || '').toLowerCase();
            const isResolved = res === 'solved' || res === 'closed' || status === 'resolved' || status === 'closed';
            const compId = getActiveCompanyId();
            const matchesComp = !compId || compId === 'all' || row.company_id === compId;

            if (isUrgent && !isResolved && matchesComp) {
              const notifiedSet = getNotifiedIds();
              if (!notifiedSet.has(row.id)) {
                markAsNotified(row.id);
                setToast({
                  id: row.id,
                  customerName: row.customer_name || `ลูกค้า #${row.customer_id || row.id}`,
                  summary: row.summary || 'พบเคสด่วนต้องการความช่วยเหลือเร่งด่วน',
                  priority: row.priority || 'urgent',
                  companyId: row.company_id
                });
                setTimeLeft(60);
                setIsPaused(false);
                triggerSound();
                return;
              }
            }
          }
        }
        pollUrgentChats();
      })
      .subscribe();

    // Listen to urgent-chat-detected custom event from other pages
    const handleUrgentEvent = (e: any) => {
      if (e?.detail) {
        const { id, customerName, summary, priority, companyId } = e.detail;
        const compId = getActiveCompanyId();
        if (!compId || compId === 'all' || companyId === compId) {
          const notifiedSet = getNotifiedIds();
          if (!notifiedSet.has(id)) {
            markAsNotified(id);
            setToast({
              id,
              customerName: customerName || `ลูกค้า #${id}`,
              summary: summary || 'พบเคสด่วนต้องการความช่วยเหลือเร่งด่วน',
              priority: priority || 'urgent',
              companyId
            });
            triggerSound();
          }
        }
      }
    };
    window.addEventListener('urgent-chat-detected', handleUrgentEvent);

    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(channel);
      window.removeEventListener('urgent-chat-detected', handleUrgentEvent);
    };
  }, []);

  const handleDismiss = () => {
    if (toast) {
      markAsNotified(toast.id);
    }
    setToast(null);
  };

  // Reset 60s countdown whenever a new toast appears
  useEffect(() => {
    if (toast) {
      setTimeLeft(60);
      setIsPaused(false);
    }
  }, [toast?.id]);

  // ⏱️ Auto-dismiss countdown timer (60s)
  useEffect(() => {
    if (!toast || isPaused) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [toast?.id, isPaused]);

  // When timer hits 0, auto dismiss
  useEffect(() => {
    if (!toast) return;
    if (timeLeft === 0) {
      handleDismiss();
    }
  }, [timeLeft, toast]);

  const handleViewChat = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!toast) return;

    const targetChatId = toast.id;
    const targetCompId = toast.companyId;

    markAsNotified(targetChatId);
    setToast(null);

    // If currently on /chats, dispatch custom event to open the floating modal immediately
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/chats') {
        window.dispatchEvent(new CustomEvent('open-chat-modal', {
          detail: { chatId: targetChatId, companyId: targetCompId }
        }));
      } else {
        // Navigate to /chats with open_chat parameter
        window.location.href = `/chats?open_chat=${targetChatId}${targetCompId ? `&company_id=${targetCompId}` : ''}`;
      }
    }
  };

  if (!toast || !popupEnabled) return null;

  return (
    <div 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white dark:bg-slate-900 border-2 border-rose-500 rounded-2xl shadow-2xl p-4 animate-slideIn select-none transition-all duration-200"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-955/30 text-rose-600 dark:text-rose-400 shrink-0 animate-bounce">
          <AlertTriangle size={20} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              🔴 เคสเร่งด่วนที่สุด! (URGENT)
            </span>
            <div className="flex items-center gap-1.5">
              <span 
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-colors ${
                  isPaused 
                    ? 'bg-amber-100 dark:bg-amber-955/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700' 
                    : 'bg-rose-50 dark:bg-rose-955/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40'
                }`}
                title={isPaused ? "หยุดนับเวลาชั่วคราวขณะชี้เมาส์" : `จะปิดอัตโนมัติในอีก ${timeLeft} วินาที`}
              >
                ⏱️ {isPaused ? 'หยุดเวลา' : `${timeLeft}s`}
              </span>
              <button 
                onClick={handleDismiss}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-0.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                title="ปิดการแจ้งเตือน"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs mt-1.5 truncate">
            คุณ {toast.customerName}
          </h4>
          
          <p className="text-[10px] text-slate-550 dark:text-slate-400 mt-1 leading-normal line-clamp-2">
            {toast.summary}
          </p>

          {/* Animated Countdown Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${isPaused ? 'bg-amber-500' : 'bg-rose-500'}`} 
              style={{ width: `${(timeLeft / 60) * 100}%` }} 
            />
          </div>

          <div className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                getAudioContext();
                playAlertTone(undefined, undefined, true);
              }}
              className="flex items-center justify-center gap-1 bg-indigo-50 dark:bg-indigo-955/40 hover:bg-indigo-100 text-indigo-650 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition shadow-sm cursor-pointer"
              title="กดทดสอบเสียงสัญญาณเตือน"
            >
              <Volume2 size={11} />
              <span>ฟังเสียงเตือน</span>
            </button>

            <button
              onClick={handleDismiss}
              className="flex-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 py-1.5 rounded-lg text-[10px] font-bold transition text-center cursor-pointer"
            >
              รับทราบ
            </button>
            
            <button
              onClick={handleViewChat}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 shadow-sm cursor-pointer"
            >
              ดูแชตนี้ <ArrowRight size={10} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
